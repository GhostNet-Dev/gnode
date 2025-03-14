import { EventEmitter } from "events";
import PBFTViewChange from "./pbftviewchange";

// ✅ 네트워크 메시지를 처리하는 EventEmitter (네트워크 시뮬레이션)
class PBFTNetwork extends EventEmitter {
  sendMessage(event: string, data: any) {
    this.emit(event, data); // 메시지 전송 (네트워크 이벤트 발생)
  }
}

// ✅ 네트워크 인스턴스 생성
export const pbftNetwork = new PBFTNetwork();


export default class PBFTConsensus {
  nodes: string[] = ["Node1", "Node2", "Node3", "Node4", "Node5"];
  primaryNode: string = this.nodes[0]; // 초기 Primary 노드
  viewNumber: number = 0;
  timeoutDuration: number = 5000; // 5초 Timeout 설정
  prepareCount: number = 0;
  commitCount: number = 0;

  constructor() {
    console.log(`🔵 [PBFT 시작] Primary 노드: ${this.primaryNode}, View Number: ${this.viewNumber}`);

    // ✅ Prepare 및 Commit 메시지 수신 이벤트 리스너 설정
    pbftNetwork.on("Prepare", (blockHash) => this.handlePrepareMessage(blockHash));
    pbftNetwork.on("Commit", (blockHash) => this.handleCommitMessage(blockHash));
    pbftNetwork.on("VIEW-CHANGE-ACK", () => this.handleViewChangeRequest())
  }

  // ✅ 블록을 네트워크에 전송 후 응답 대기 (Promise 사용)
  async proposeBlock(block: string): Promise<boolean> {
    console.log(`🟢 [Pre-Prepare] ${this.primaryNode} 블록 제안: ${block}`);

    return new Promise((resolve, reject) => {
      const blockHash = this.generateBlockHash(block);

      // ✅ 네트워크에 블록 전송
      pbftNetwork.sendMessage("Pre-Prepare", blockHash);

      // ✅ Timeout 처리 (5초 후 응답이 없으면 View Change 실행)
      const timeout = setTimeout(() => {
        console.log(`⚠️ [Timeout] ${this.primaryNode} 블록 응답 없음! View Change 실행`);
        this.executeViewChange();
        reject(false); // 실패 반환
      }, this.timeoutDuration);

      // ✅ Prepare 메시지가 2/3 이상 도착하면 Commit 단계로 이동
      pbftNetwork.once("PrepareSuccess", () => {
        clearTimeout(timeout); // Timeout 해제
        this.commitPhase(blockHash).then(resolve).catch(reject);
      });
    });
  }

  // ✅ Prepare 메시지 수신 핸들러
  handlePrepareMessage(blockHash: string) {
    this.prepareCount++;
    console.log(`✅ [Prepare] 블록 승인 수: ${this.prepareCount}`);

    // 2/3 이상 노드가 승인하면 Commit 단계로 이동
    if (this.prepareCount >= 4) {
      pbftNetwork.sendMessage("PrepareSuccess", blockHash);
    }
  }

  // ✅ Commit 단계 실행
  async commitPhase(blockHash: string): Promise<boolean> {
    console.log(`🟣 [Commit] 최종 투표 진행...`);

    return new Promise((resolve, reject) => {
      pbftNetwork.sendMessage("Commit", blockHash);

      // ✅ Timeout 설정
      const timeout = setTimeout(() => {
        console.log(`⚠️ [Timeout] Commit 응답 없음! View Change 실행`);
        this.executeViewChange();
        reject(false);
      }, this.timeoutDuration);

      // ✅ Commit 메시지가 2/3 이상 도착하면 성공 처리
      pbftNetwork.once("CommitSuccess", () => {
        clearTimeout(timeout); // Timeout 해제
        console.log("✅ [PBFT 성공] 블록이 승인되었습니다!");
        resolve(true);
      });
    });
  }

  // ✅ Commit 메시지 수신 핸들러
  handleCommitMessage(blockHash: string) {
    this.commitCount++;
    console.log(`✅ [Commit] 블록 최종 승인 수: ${this.commitCount}`);

    // 2/3 이상 노드가 승인하면 최종 블록 승인
    if (this.commitCount >= 4) {
      pbftNetwork.sendMessage("CommitSuccess", blockHash);
    }
  }


  
  // ✅ View Change 요청 처리
  handleViewChangeRequest() {
    console.log(`⚠️ [View Change 요청 감지]`);
    pbftNetwork.sendMessage("VIEW-CHANGE-ACK", {});
  }

  // ✅ View Change 실행 (리더 교체)
  async executeViewChange(): Promise<boolean> {
    const viewChange = new PBFTViewChange(this.nodes, this.primaryNode, this.viewNumber);
    const newPrimary = await viewChange.requestViewChange();

    if (!newPrimary) {
      console.log("❌ [View Change 실패] 새로운 Primary 노드를 찾을 수 없음!");
      return false;
    }

    this.primaryNode = newPrimary;
    this.viewNumber++;

    return this.proposeBlock(`NewBlock_View${this.viewNumber}`);
  }

  // ✅ 블록 해시 생성 (SHA-256)
  generateBlockHash(block: string): string {
    return require("crypto").createHash("sha256").update(block).digest("hex");
  }
}


import { pbftNetwork } from "./pbftconsensus";

export default class PBFTViewChange {
  nodes: string[];
  primaryNode: string;
  viewNumber: number;
  timeoutThreshold: number;
  timeoutCount: { [key: string]: number };

  constructor(nodes: string[], currentPrimary: string, currentView: number = 0, timeoutThreshold: number = 3) {
    this.nodes = nodes;
    this.primaryNode = currentPrimary;
    this.viewNumber = currentView;
    this.timeoutThreshold = timeoutThreshold;

    this.timeoutCount = {};
    for (const node of this.nodes) {
      this.timeoutCount[node] = 0;
    }

    console.log(`🔵 [PBFT View Change 시작] Primary 노드: ${this.primaryNode}, View Number: ${this.viewNumber}`);
  }

  // ✅ View Change 요청을 보냄
  async requestViewChange(): Promise<string | null> {
    console.log("⚠️ [View Change] View Change 요청 중...");
    
    return new Promise((resolve) => {
      let viewChangeCount = 0;
      pbftNetwork.sendMessage("VIEW-CHANGE", { viewNumber: this.viewNumber });

      pbftNetwork.on("VIEW-CHANGE-ACK", () => {
        viewChangeCount++;
        console.log(`✅ [View Change] 노드 동의 수: ${viewChangeCount}`);

        // ✅ 2/3 이상의 노드가 View Change를 승인하면 새로운 Primary 선정
        if (viewChangeCount >= Math.ceil((2 / 3) * this.nodes.length)) {
          const newPrimary = this.selectNewPrimary();
          resolve(newPrimary);
        }
      });

      // Timeout 설정
      setTimeout(() => {
        console.log("❌ [View Change 실패] 충분한 동의를 받지 못함!");
        resolve(null);
      }, 5000);
    });
  }

  // ✅ 새로운 Primary를 선정
  selectNewPrimary(): string {
    this.viewNumber++;
    const newPrimary = this.nodes[this.viewNumber % this.nodes.length];
    console.log(`🔄 [View Change 성공] 새로운 Primary 노드: ${newPrimary}`);
    return newPrimary;
  }
}


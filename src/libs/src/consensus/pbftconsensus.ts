import PBFTViewChange from "./pbftviewchange";
import ValidatorManager from "./validators";
import BlockManager from "@GBlibs/blocks/blocks";
import TransactionManager from "@GBlibs/txs/txs";
import { Block } from "@GBlibs/blocks/blocktypes";
import { NetworkInterface } from "@GBlibs/network/inetwork";

export default class PBFTConsensus {
  primaryNode: string;
  viewNumber: number = 0;
  timeoutDuration: number = 5000;
  validatorManager: ValidatorManager;
  blockManager: BlockManager;
  txManager: TransactionManager;

  constructor(
    validatorManager: ValidatorManager,
    blockManager: BlockManager,
    txManager: TransactionManager,
    private pbftNetwork: NetworkInterface
  ) {
    this.validatorManager = validatorManager;
    this.blockManager = blockManager;
    this.txManager = txManager;
    this.primaryNode = this.validatorManager.getValidators()[0];

    console.log(`🔵 [PBFT 시작] Primary 노드: ${this.primaryNode}, View Number: ${this.viewNumber}`);

    pbftNetwork.on("Prepare", (block, validator) => this.handlePrepareMessage(block, validator));
    pbftNetwork.on("Commit", (block, validator) => this.handleCommitMessage(block, validator));
    pbftNetwork.on("VIEW-CHANGE-ACK", () => this.handleViewChangeRequest());
  }

  // ✅ 블록을 제안하고 합의를 요청
  async proposeBlock(transactions: any[]): Promise<boolean> {
    console.log(`🟢 [Pre-Prepare] ${this.primaryNode} 블록 생성 요청`);

    // 🔍 새로운 블록 생성
    const newBlock = await this.blockManager.createBlock(transactions, this.primaryNode, this.txManager);

    // ✅ 블록 검증
    if (!(await this.blockManager.isValidBlock(newBlock, this.blockManager.getLatestBlock(), this.txManager))) {
      console.error("❌ [Pre-Prepare] 블록 검증 실패!");
      return false;
    }

    console.log(`✅ [Pre-Prepare] 블록 검증 완료, 합의 요청`);
    this.pbftNetwork.sendMessage("Pre-Prepare", newBlock);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log(`⚠️ [Timeout] 블록 응답 없음! View Change 실행`);
        this.executeViewChange();
        reject(false);
      }, this.timeoutDuration);

      this.pbftNetwork.once("PrepareSuccess", () => {
        clearTimeout(timeout);
        this.commitPhase(newBlock).then(resolve).catch(reject);
      });
    });
  }

  // ✅ Prepare 메시지 처리 (Validator 투표 포함)
  async handlePrepareMessage(block: Block, validator: string) {
    await this.validatorManager.castVote(block.hash, validator);
    console.log(`✅ [Prepare] ${validator} 블록 승인`);

    if (await this.validatorManager.hasConsensus(block.hash)) {
      this.pbftNetwork.sendMessage("PrepareSuccess", block);
    }
  }

  // ✅ Commit 단계 실행 (Validator 투표 포함)
  async commitPhase(block: Block): Promise<boolean> {
    console.log(`🟣 [Commit] 최종 투표 진행...`);
    this.pbftNetwork.sendMessage("Commit", block);

    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log(`⚠️ [Timeout] Commit 응답 없음! View Change 실행`);
        this.executeViewChange();
        reject(false);
      }, this.timeoutDuration);

      this.pbftNetwork.once("CommitSuccess", async () => {
        clearTimeout(timeout);
        console.log("✅ [PBFT 성공] 블록 승인 완료!");

        // ✅ 블록 승인 후 저장
        await this.blockManager.saveBlock(block);
        console.log("✅ [Block 저장 완료]");

        // ✅ 블록 승인 후 후속 처리 (예: Validator 보상)
        this.handlePostBlockApproval(block);
        resolve(true);
      });
    });
  }

  // ✅ Commit 메시지 처리 (Validator 투표 포함)
  async handleCommitMessage(block: Block, validator: string) {
    await this.validatorManager.castVote(block.hash, validator);
    console.log(`✅ [Commit] ${validator} 블록 최종 승인`);

    if (await this.validatorManager.hasConsensus(block.hash)) {
      this.pbftNetwork.sendMessage("CommitSuccess", block);
    }
  }

  // ✅ 블록 승인 후 후속 처리 (Validator 보상)
  async handlePostBlockApproval(block: Block) {
    console.log(`✅ [후속 처리] 블록 승인 후 추가 작업 수행`);
    // 🚀 Validator 보상 로직 추가 가능
  }

  // ✅ View Change 요청 처리
  handleViewChangeRequest() {
    console.log(`⚠️ [View Change 요청 감지]`);
    this.pbftNetwork.sendMessage("VIEW-CHANGE-ACK", {});
  }

  // ✅ View Change 실행 (리더 교체)
  async executeViewChange(): Promise<boolean> {
    const viewChange = new PBFTViewChange(this.pbftNetwork, this.validatorManager.getValidators(), this.primaryNode, this.viewNumber);
    const newPrimary = await viewChange.requestViewChange();

    if (!newPrimary) {
      console.log("❌ [View Change 실패] 새로운 Primary 노드를 찾을 수 없음!");
      return false;
    }

    this.primaryNode = newPrimary;
    this.viewNumber++;

    return this.proposeBlock([]);
  }
}


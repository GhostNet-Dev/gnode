import { logger } from "@GBlibs/logger/logger";
import { NetworkInterface } from "@GBlibs/network/inetwork";

export default class PBFTViewChange {
  nodes: string[];
  primaryNode: string;
  viewNumber: number;
  timeoutThreshold: number;
  timeoutCount: { [key: string]: number };

  constructor(
    private pbftNetwork: NetworkInterface,
    nodes: string[],
    currentPrimary: string,
    currentView: number = 0,
    timeoutThreshold: number = 3
  ) {
    this.nodes = nodes;
    this.primaryNode = currentPrimary;
    this.viewNumber = currentView;
    this.timeoutThreshold = timeoutThreshold;

    this.timeoutCount = {};
    for (const node of this.nodes) {
      this.timeoutCount[node] = 0;
    }

    logger.info(`🔵 [PBFT View Change 시작] Primary 노드: ${this.primaryNode}, View Number: ${this.viewNumber}`);
  }

  // ✅ View Change 요청을 보냄
  async requestViewChange(): Promise<string | null> {
    logger.info("⚠️ [View Change] View Change 요청 중...");

    return new Promise((resolve) => {
      let viewChangeCount = 0;
      this.pbftNetwork.sendMessage("VIEW-CHANGE", { viewNumber: this.viewNumber });

      this.pbftNetwork.on("VIEW-CHANGE-ACK", () => {
        viewChangeCount++;
        logger.info(`✅ [View Change] 노드 동의 수: ${viewChangeCount}`);

        // ✅ 2/3 이상의 노드가 View Change를 승인하면 새로운 Primary 선정
        if (viewChangeCount >= Math.ceil((2 / 3) * this.nodes.length)) {
          const newPrimary = this.selectNewPrimary();
          resolve(newPrimary);
        }
      });

      // Timeout 설정
      setTimeout(() => {
        logger.info("❌ [View Change 실패] 충분한 동의를 받지 못함!");
        resolve(null);
      }, 5000);
    });
  }

  // ✅ 새로운 Primary를 선정
  selectNewPrimary(): string {
    this.viewNumber++;
    const newPrimary = this.nodes[this.viewNumber % this.nodes.length];
    logger.info(`🔄 [View Change 성공] 새로운 Primary 노드: ${newPrimary}`);
    return newPrimary;
  }
}


// dailyBlockStats.ts
import { Block } from "./blocktypes";
import { logger } from "@GBlibs/logger/logger";
import { blockDB } from "./blocks";

// LevelDB 인스턴스 (block index -> Block)
export default class BlockStats {
  /**
   * ✅ 특정 일자(연-월-일)의 블록 수 반환 (YYYY, MM, DD 분리 입력)
   */
  async getBlockCountForDate(year: number, month: number, day: number): Promise<number> {
    let count = 0;

    for await (const [, value] of blockDB.iterator()) {
      const block = value as Block;
      const date = new Date(block.timestamp);

      if (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * ✅ 특정 일자의 모든 블록을 시간 순으로 그룹핑하여 반환 (YYYY, MM, DD 분리 입력)
   */
  async getBlocksForDateGrouped(year: number, month: number, day: number): Promise<Record<string, Block[]>> {
    const groupedBlocks: Record<string, Block[]> = {};

    for await (const [, value] of blockDB.iterator()) {
      const block = value as Block;
      const date = new Date(block.timestamp);

      if (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
      ) {
        // const hour = date.getHours().toString().padStart(2, '0');
        // const minute = date.getMinutes().toString().padStart(2, '0');
        const timeKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        logger.info(timeKey);

        if (!groupedBlocks[timeKey]) {
          groupedBlocks[timeKey] = [];
        }
        groupedBlocks[timeKey].push(block);
      }
    }

    return groupedBlocks;
  }

  /**
   * ✅ 일자별 블록 생성량 통계 수집
   */
  async getDailyBlockCounts(): Promise<Record<string, number>> {
    const dailyCounts: Record<string, number> = {};

    for await (const [, value] of blockDB.iterator()) {
      const block = value as Block;
      const date = new Date(block.timestamp);
      const dayStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
      dailyCounts[dayStr] = (dailyCounts[dayStr] || 0) + 1;
    }

    return dailyCounts;
  }

  /**
   * ✅ 콘솔에 요약 출력
   */
  async printSummary(): Promise<void> {
    const stats = await this.getDailyBlockCounts();
    const sortedDates = Object.keys(stats).sort();

    console.log("\n📊 일자별 블록 생산 통계:");
    for (const date of sortedDates) {
      console.log(` - ${date}: ${stats[date]} blocks`);
    }
  }
} 

// 사용 예시
// const stats = new BlockStats();
// stats.getBlockCountForDate(2025, 4, 11);
// stats.getBlocksForDateGrouped(2025, 4, 11);
// stats.printSummary();


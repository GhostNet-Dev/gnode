import { Transaction } from "@GBlibs/txs/txtypes";

// 블록 (PBFT 기반)
export interface Block {
  index: number;
  previousHash: string;
  timestamp: number;
  transactions: Transaction[];
  validator: string;
  // Validator 목록(합의 참여자 정보)
  validators: string[];
  hash: string;
}


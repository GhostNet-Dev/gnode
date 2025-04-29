export interface UTXO {
  txid: string;
  index: number;
  amount: number;
  owner: string;
  key?: string;      // key-value 기반 데이터 식별자 (선택)
  hash?: string;     // 데이터 해시 또는 "__deleted__" (선택)
}

export interface Transaction {
  txid: string; // 트랜잭션 해시
  inputs: UTXO[]; // 사용된 UTXO 리스트
  outputs: UTXO[]; // 새로 생성된 UTXO 리스트
  signature: string; // 서명 (ECDSA 기반)
  mediator: string; // 중계자
  senderPublicKey: string; // 서명 검증을 위한 공개키
}


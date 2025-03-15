# gnode
GhostNet Node

Blockchain
 ├── PBFTConsensus
 │    ├── ValidatorManager
 │    ├── BlockManager
 │    ├── TransactionManager
 │    ├── NetworkInterface (PBFTNetwork 또는 GossipP2P)
 │
 ├── PendingTransactionPool
 │    ├── LevelDB (트랜잭션 임시 저장)
 │
 ├── TransactionManager
 │    ├── KeyManager (서명 및 검증)
 │    ├── LevelDB (트랜잭션 저장)
 │
 ├── BlockManager
 │    ├── LevelDB (블록 저장)
 │
 ├── ValidatorManager
 │    ├── LevelDB (Validator 정보 저장)
 │
 ├── KeyManager
      ├── LevelDB (암호화된 개인키 저장)



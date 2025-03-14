import Peer, { DataConnection } from 'peerjs';
import { v4 as uuidv4 } from "uuid"
import DHTPeer from './dhtpeer';
import { GPType, GPacket } from './packet';

/**
 * PeerJS 기반 Gossip Protocol
 */
export default class GossipP2P {
  private peer: Peer;
  private peers: Map<string, DataConnection>;
  private receivedMessages: Set<string>; // 중복 메시지 방지
  id = uuidv4()

  constructor(dht: DHTPeer) {
    this.peer = dht.peer
    this.peers = dht.peers
    this.receivedMessages = new Set();

  /**
   * 받은 트랜잭션 처리
   */
    dht.RegisterListener(GPType.TransactionSq, (data: GPacket, conn: DataConnection) => {
      const { transaction, messageId } = data.value;

      if (this.receivedMessages.has(messageId)) return; // 중복 메시지 무시
      this.receivedMessages.add(messageId);

      console.log(`Received Transaction: ${JSON.stringify(transaction)}`);

      // 추가로 Gossip을 통해 다른 노드에게 전파
      this.gossipTransaction(transaction);
    })
  }

  /**
   * Gossip을 사용하여 트랜잭션 전송
   */
  gossipTransaction(transaction: any) {
    const messageId = this.generateMessageId(transaction);
    if (this.receivedMessages.has(messageId)) return; // 중복 전송 방지

    this.receivedMessages.add(messageId);
    console.log(`Broadcasting Transaction: ${JSON.stringify(transaction)}`);

    // 무작위로 일부 노드 선택 (예: 50% 확률로 전송)
    this.getRandomPeers().forEach((conn) => conn.send({ type: 'transaction', transaction, messageId }));
  }

  /**
   * 랜덤한 일부 노드 선택 (전체 노드 중 50% 선택)
   */
  private getRandomPeers(): DataConnection[] {
    const allPeers = Array.from(this.peers.values());
    return allPeers.filter(() => Math.random() < 0.5); // 50% 확률로 노드 선택
  }

  /**
   * 트랜잭션을 고유 메시지 ID로 변환
   */
  private generateMessageId(transaction: any): string {
    return JSON.stringify(transaction) + Date.now().toString();
  }
}
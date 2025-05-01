import Peer, { DataConnection } from "peerjs";
import { v4 as uuidv4 } from "uuid";
import DHTPeer from "./dhtpeer";
import { GPType, GPacket } from "./packet";
import { NetworkInterface } from "./inetwork";

/**
 * PeerJS 기반 Gossip Protocol (PBFT NetworkInterface 호환)
 */
export default class GossipP2P implements NetworkInterface {
  peer: Peer;
  peers: Map<string, DataConnection>;
  private receivedMessages: Set<string>; // 중복 메시지 방지
  private eventListeners: Map<string, ((data: any, conn?: DataConnection) => void)[]>;
  private onceListeners: Map<string, ((data: any, conn?: DataConnection) => void)>;

  /**
   * Gossip Network 내 모든 Peer ID 반환
   */
  get Peers(): string[] {
    return Array.from(this.peers.keys());
  }

  id = uuidv4();

  constructor(dht: DHTPeer) {
    this.peer = dht.peer;
    this.peers = dht.peers;
    this.receivedMessages = new Set();
    this.eventListeners = new Map();
    this.onceListeners = new Map();

    // ✅ 트랜잭션 수신 이벤트 등록 (Gossip 기반 전파)
    dht.RegisterListener(GPType.TransactionSq, (data: GPacket, conn: DataConnection) => {
      const { transaction, messageId } = data.value;

      if (this.receivedMessages.has(messageId)) return; // 중복 메시지 무시
      this.receivedMessages.add(messageId);

      console.log(`🔵 [GossipP2P] 트랜잭션 수신: ${JSON.stringify(transaction)}`);

      // ✅ 이벤트 리스너 실행 (PBFT와 호환)
      this.triggerEvent("transaction", transaction, conn);

      // ✅ 추가 Gossip 전파
      this.gossipTransaction(transaction);
    });
  }

  /**
   * ✅ PBFTNetwork와 호환되는 sendMessage 메서드
   * @param event 이벤트 타입 (예: "Pre-Prepare", "Prepare", "Commit")
   * @param data 전달할 데이터 (트랜잭션, 블록 등)
   */
  sendMessage(event: string, data: any) {
    const messageId = this.generateMessageId(data);
    if (this.receivedMessages.has(messageId)) return; // 중복 전송 방지

    this.receivedMessages.add(messageId);
    console.log(`📡 [GossipP2P] 메시지 전송: ${event}, 데이터: ${JSON.stringify(data)}`);

    // 무작위로 일부 노드에게 Gossip 방식으로 전송
    this.getRandomPeers().forEach((conn) => conn.send({ type: event, data, messageId }));
  }

  /**
   * ✅ PBFTNetwork와 호환되는 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 이벤트 발생 시 실행할 콜백 함수
   */
  on(event: string, listener: (data: any, conn?: DataConnection) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  once(event: string, listener: (data: any) => void) {
    this.onceListeners.set(event, listener);
  }


  /**
   * ✅ 특정 이벤트가 발생했을 때 모든 리스너 실행
   * @param event 이벤트 타입
   * @param data 전달할 데이터
   */
  private triggerEvent(event: string, data: any, conn?: DataConnection) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)?.forEach((listener) => listener(data, conn));
    }

    if (this.onceListeners.has(event)) {
      this.onceListeners.get(event)?.(data);
      this.onceListeners.delete(event);
    }
  }

  /**
   * 🔄 Gossip을 사용하여 트랜잭션 전송
   * @param transaction 전송할 트랜잭션
   */
  private gossipTransaction(transaction: any) {
    this.sendMessage("transaction", transaction);
  }

  /**
   * 🎲 랜덤한 일부 노드 선택 (전체 노드 중 50% 선택)
   * @returns 선택된 DataConnection 목록
   */
  private getRandomPeers(): DataConnection[] {
    const allPeers = Array.from(this.peers.values());
    return allPeers.filter(() => Math.random() < 0.5); // 50% 확률로 노드 선택
  }

  /**
   * 🆔 트랜잭션을 고유 메시지 ID로 변환
   * @param transaction 트랜잭션 데이터
   * @returns 고유 메시지 ID
   */
  private generateMessageId(transaction: any): string {
    return JSON.stringify(transaction) + Date.now().toString();
  }
}


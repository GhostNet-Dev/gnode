// ✅ 네트워크 인터페이스 (교체 가능하도록 설계)
export interface INetworkInterface {
  get Peers(): string[];
  sendMessage(event: string, data: any): void;
  on(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
}


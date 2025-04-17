import { IChannel } from "@Commons/icom";
import Page, { IPage } from "@Webs/views/page";
import { RouteType } from "../../types/routetypes";
import { sha256 } from "js-sha256";

export default class MakeAccountPage extends Page implements IPage {
  constructor(private ch: IChannel) {
    super("html/makeaccount.html")
  }

  async Run(): Promise<boolean> {
    await this.LoadHtml()
    this.binding()
    return true
  }
  Release(): void {
    this.ReleaseHtml()

  }
  async hashPassword(password: string) {
    return sha256(password)
  }
  binding() {
    const form = document.getElementById('createForm') as HTMLFormElement;
    const result = document.getElementById('result') as HTMLDivElement;
    const mnemonicBox = document.getElementById('mnemonicBox') as HTMLDivElement;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = (document.getElementById('id') as HTMLInputElement).value;
      const pw = (document.getElementById('password') as HTMLInputElement).value;
      const confirm = (document.getElementById('confirm') as HTMLInputElement).value;

      if (pw !== confirm) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }
      const passwordHashed = await this.hashPassword(pw);
      this.ch.SendMsg(RouteType.MakeAccountReq, id, passwordHashed)
    });
    this.ch.RegisterMsgHandler(RouteType.MakeAccountRes, ({ ret, pubKey, privKey }: { ret: boolean, pubKey: string, privKey: string }) => {
      // 1. 시드 구문 생성 (BIP39 사용)
      if(!ret) {
        mnemonicBox.textContent = "생성에 실패하였습니다."
        return 
      }
      const mnemonic = pubKey//generateMnemonic(); // 12단어 시드 구문
      // 2. (실제 앱에서는 여기서 비밀번호로 암호화하고 백업 권유)

      // 3. 결과 표시
      mnemonicBox.textContent = mnemonic;
      result.classList.remove('d-none');
    })
  }
}


import { IChannel } from "@Commons/icom";
import Page, { IPage } from "@Webs/views/page";
import { sha256 } from "js-sha256";
import { RouteType } from "../../types/routetypes";
import Sessions from "src/wlibs/src/sessions/session";
import DHTPeer from "@GBlibs/network/dhtpeer";
import GossipP2P from "@GBlibs/network/gossipp2p";
import { RendererNet } from "@Commons/renderernet";

export default class LoginPage extends Page implements IPage {
  id = ""
  constructor(private ch: IChannel, private sess: Sessions, private net: RendererNet) {
    super("html/login.html")


    this.ch.RegisterMsgHandler(RouteType.AccountListRes, (data: { key: string, value: string }[]) => {
      const dom = document.getElementById("acclist")
      let html = ""
      if (data.length > 0 && dom) {
        data.forEach((entry) => {
          html += `
          <li class="list-group-item" onclick="
            document.getElementById('id').value='${entry.key}'
          ">${entry.key}@${entry.value}</li>
          `
        })
        dom.innerHTML = html
      }
    })
    this.ch.RegisterMsgHandler(RouteType.LoginRes, (res: { ret: boolean, token: string, addr: string }) => {
      const resultEl = document.getElementById('result') as HTMLDivElement;
      if (res.ret) {
        this.sess.saveToken(res.token)
        resultEl.textContent = '로그인 성공!';
        // TODO: redirect or save token
        this.SuccessLogin(res.addr)
      } else {
        resultEl.textContent = '로그인 실패';
      }
    })
    this.ch.RegisterMsgHandler(RouteType.SessionCheckRes, async (ret: { userId: string | null, addr: string }) => {
      if (ret != null) {
        this.SuccessLogin(ret.addr)
      } else {
        await this.LoadHtml()
        this.binding()
        this.GetAccountList()
      }
    })
    this.ch.RegisterMsgHandler(RouteType.SessionFailNoti, () => {
      this.sess.removeToken()
      window.ClickLoadPage('login', false)
    })
  }
  SuccessLogin(pubKey: string) {
    const menu = document.getElementById('navbarLoginMenu') as HTMLUListElement;
    menu.style.display = "none"
    const menuOut = document.getElementById('navbarLogoutMenu') as HTMLUListElement;
    menuOut.style.display = "block"
    const acc = document.getElementById('accountTxt') as HTMLLIElement;
    acc.innerText = this.id

    this.net.StartPeer(pubKey)

    window.ClickLoadPage('dashboard', false)
  }

/**
 * Runs the login page logic. If a session token exists, it sends a session check request.
 * Otherwise, it loads the HTML, binds events, and retrieves the account list.
 * @returns A promise that resolves to true when completed.
 */

  async Run(): Promise<boolean> {
    const token = this.sess.getToken()
    if (token) {
      this.ch.SendMsg(RouteType.SessionCheckReq, token)
    } else {
      await this.LoadHtml()
      this.binding()
      this.GetAccountList()
    }
    return true
  }
  Release(): void {
    this.ReleaseHtml()

  }
  async hashPassword(password: string) {
    return sha256(password)
  }
  binding() {
    const menu = document.getElementById('navbarLoginMenu') as HTMLUListElement;
    menu.style.display = "block"
    const menuOut = document.getElementById('navbarLogoutMenu') as HTMLUListElement;
    menuOut.style.display = "none"

    const btn = document.getElementById('loginBtn') as HTMLButtonElement;
    btn.onclick = async () => {
      const id = (document.getElementById('id') as HTMLInputElement).value;
      const passwordRaw = (document.getElementById('password') as HTMLInputElement).value;
      const passwordHashed = await this.hashPassword(passwordRaw);

      // 보안: 실제 API 요청 시 HTTPS 사용 + 서버에서 해시 검증

      const resultEl = document.getElementById('result') as HTMLDivElement;
      resultEl.textContent = '처리 중...';
      this.ch.SendMsg(RouteType.LoginReq, id, passwordHashed)
      this.id = id
    }
  }
  GetAccountList() {
    this.ch.SendMsg(RouteType.AccountListReq)
  }
}

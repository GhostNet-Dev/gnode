import { IChannel } from "@Commons/icom";
import Page, { IPage } from "@GBlibs/webs/views/page";
import { sha256 } from "js-sha256";
import { RouteType } from "../../types/routetypes";
import Sessions from "@GBlibs/webs/sessions/session";

export default class LoginPage extends Page implements IPage {
  id = ""
  constructor(private ch: IChannel, private sess: Sessions) {
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
    this.ch.RegisterMsgHandler(RouteType.LoginRes, (res: { ret: boolean, token: string }) => {
      const resultEl = document.getElementById('result') as HTMLDivElement;
      if (res.ret) {
        this.sess.saveToken(res.token)
        resultEl.textContent = '로그인 성공!';
        // TODO: redirect or save token
        this.SuccessLogin()
      } else {
        resultEl.textContent = '로그인 실패';
      }
    })
    this.ch.RegisterMsgHandler(RouteType.SessionCheckRes, async (userId: string | null) => {
      if (userId != null) {
        this.SuccessLogin()
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
  SuccessLogin() {
    const menu = document.getElementById('navbarLoginMenu') as HTMLUListElement;
    menu.style.display = "none"
    const menuOut = document.getElementById('navbarLogoutMenu') as HTMLUListElement;
    menuOut.style.display = "block"
    const acc = document.getElementById('accountTxt') as HTMLLIElement;
    acc.innerText = this.id

    window.ClickLoadPage('dashboard', false)
  }

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

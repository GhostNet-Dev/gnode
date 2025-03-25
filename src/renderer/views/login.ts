import Page, { IPage } from "@GBlibs/webs/views/page";

export default class LoginPage extends Page implements IPage {
  constructor() {
    super("html/login.html")
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
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  binding() {
    (document.getElementById('loginForm') as HTMLFormElement).addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = (document.getElementById('email') as HTMLInputElement).value;
      const passwordRaw = (document.getElementById('password') as HTMLInputElement).value;
      const passwordHashed = await this.hashPassword(passwordRaw);

      // 보안: 실제 API 요청 시 HTTPS 사용 + 서버에서 해시 검증
      const resultEl = document.getElementById('result') as HTMLDivElement;
      resultEl.textContent = '처리 중...';

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: passwordHashed })
        });

        const data = await response.json();
        if (response.ok) {
          resultEl.textContent = '로그인 성공!';
          // TODO: redirect or save token
        } else {
          resultEl.textContent = data.message || '로그인 실패';
        }
      } catch (err) {
        resultEl.textContent = '서버 연결 오류';
      }
    });
  }
}

const TOKEN_KEY = "authToken";

export default class Sessions {
    /**
     * 토큰 저장 (로그인 성공 시)
     */
    saveToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    /**
     * 토큰 불러오기 (웹소켓 연결 시 등)
     */
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * 토큰 삭제 (로그아웃 시)
     */
    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
    }
}

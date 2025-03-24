import KeyMaker from "./keymaker";

export default class AppRoutes {
    constructor(
        private keyMaker: KeyMaker,
    ) {

    }
    async LoadKeys(id: string, pass: string) {
        return await this.keyMaker.LoadKeyPair(id, pass)
    }
}
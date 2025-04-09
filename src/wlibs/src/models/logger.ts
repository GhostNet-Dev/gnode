
const MaxLog = 256
type LogMap = { [key: string]: string[] };

export class Logger {
    logs: LogMap
    constructor() {
        this.logs = {}
    }

    AddLog(type: string, log: string) {
        if (this.logs[type] == null) {
            this.logs[type] = []
        }
        this.logs[type].push(log)
        if (this.logs[type].length > MaxLog) {
            this.logs[type].shift()
        }
    }
    GetLogs(type: string): string[] {
        return this.logs[type]
    }
}
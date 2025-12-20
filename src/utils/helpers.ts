import { BadRequestException } from "@nestjs/common";

export class Helper {
  static formatDates = (obj: any, visited?: WeakSet<object>): any => {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) {
      return obj
        .toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })
        .split(' ')[1];
    }
    const type = typeof obj;
    if (type !== 'object') return obj;

    if (!visited) visited = new WeakSet<object>();
    if (visited.has(obj)) return obj;
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) => this.formatDates(item, visited));
    }

    const formatted: any = {};
    for (const key of Object.keys(obj)) {
      formatted[key] = this.formatDates((obj as any)[key], visited);
    }
    return formatted;
  };
}

export default Helper;
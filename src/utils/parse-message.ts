export class Utils {
  static parseTelegramMessage(content: string): string {
    return content.replace(/([_`\[\]()~>#+\-=|{}.!\\])/g, '\\$1'); // NÃO inclui '*'
  }
}

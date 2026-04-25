declare module '@kobalab/majiang-core' {
  export class Board {
    shoupai: Shoupai[];
    he: any[];
    shan: any;
    zhuangfeng: number;
    menfeng(id: number): number;
  }

  export class Player {
    _model: Board;
    _id: number;
    _menfeng: number;
    _callback: any;
    _rule: any;

    constructor();
    action(msg: any, callback: any): void;
    
    get shoupai(): Shoupai;
    get he(): any;
    get shan(): any;

    get_dapai(shoupai: Shoupai): string[];
    
    kaiju(kaiju: any): void;
    qipai(qipai: any): void;
    zimo(zimo: any, gangzimo: boolean): void;
    dapai(dapai: any): void;
    fulou(fulou: any): void;
    gang(gang: any): void;
    kaigang(kaigang: any): void;
    hule(hule: any): void;
    pingju(pingju: any): void;
    jieju(paipu: any): void;

    action_kaiju(kaiju: any): void;
    action_qipai(qipai: any): void;
    action_zimo(zimo: any, gangzimo: boolean): void;
    action_dapai(dapai: any): void;
    action_fulou(fulou: any): void;
    action_gang(gang: any): void;
    action_hule(hule: any): void;
    action_pingju(pingju: any): void;
    action_jieju(paipu: any): void;
  }

  export class Shoupai {
    constructor(qipai?: string[]);
    static fromString(paistr: string): Shoupai;
    clone(): Shoupai;
    toString(): string;
    zimo(p: string): Shoupai;
    dapai(p: string): Shoupai;
    get_dapai(): string[];
    _zimo: string | null;
    _bingpai: {
      m: number[];
      p: number[];
      s: number[];
      z: number[];
      [key: string]: number[];
    };
  }

  export class Game {
    constructor(players: Player[], callback?: any, rule?: any, title?: string);
    kaiju(): void;
    model: {
      zhuangfeng: number;
      jushu: number;
      changbang: number;
      defen: number[];
      player_id: number[];
      he: any[];
    };
  }

  export namespace Util {
    export function xiangting(shoupai: Shoupai): number;
  }

  export function rule(): any;
}

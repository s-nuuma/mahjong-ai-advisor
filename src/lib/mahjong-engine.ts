import { Player, Game, Shoupai } from '@kobalab/majiang-core';

export interface GameState {
  kyoku: string;
  honba: number;
  turn: number;
  tehai: string[];
  tsumo: string | null;
  kawa: {
    player: string[];
    shimocha: string[];
    toimen: string[];
    kamicha: string[];
  };
}

// Convert Shoupai string (e.g. "m123p45s6z1") to array of individual tiles (e.g. ["m1", "m2", "m3", "p4", "p5", "s6", "z1"])
export function parseTiles(paistr: string): string[] {
  const tiles: string[] = [];
  const suits = paistr.match(/[mpsz][\d\*\_]+/g);
  if (!suits) return tiles;
  
  for (const suit of suits) {
    const s = suit[0]; // 'm', 'p', 's', 'z'
    for (let i = 1; i < suit.length; i++) {
      if (suit[i] === '*' || suit[i] === '_') continue;
      tiles.push(`${s}${suit[i]}`);
    }
  }
  return tiles;
}

export class CPUPlayer extends Player {
  private updateStateCallback: () => void;

  constructor(id: number, updateStateCallback: () => void) {
    super();
    this._id = id;
    this.updateStateCallback = updateStateCallback;
  }

  action_zimo(zimo: any, gangzimo: boolean) {
    if (zimo.l !== this._menfeng) {
      if (this._callback) this._callback();
      return;
    }

    // CPU Turn
    setTimeout(() => {
      // Very simple logic: discard the drawn tile, or a random valid tile
      const options = this.get_dapai(this.shoupai) || [];
      const dapai = options.length > 0 ? options[options.length - 1] : (zimo.p + '_'); 
      if (this._callback) this._callback({ dapai });
    }, 500); // 500ms delay for natural feel
  }

  action_dapai(dapai: any) {
    if (this._callback) this._callback();
    this.updateStateCallback();
  }

  action_kaiju(kaiju: any) { if (this._callback) this._callback(); }
  action_qipai(qipai: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_fulou(fulou: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_gang(gang: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_hule(hule: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_pingju(pingju: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_jieju(paipu: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
}

export class HumanPlayer extends Player {
  private updateStateCallback: () => void;

  constructor(id: number, updateStateCallback: () => void) {
    super();
    this._id = id;
    this.updateStateCallback = updateStateCallback;
  }

  action_zimo(zimo: any, gangzimo: boolean) {
    if (zimo.l !== this._menfeng) {
      if (this._callback) this._callback();
      this.updateStateCallback();
      return;
    }

    // Human Turn: do NOT call this._callback() automatically.
    // Wait for userDiscard() to be called.
    this.updateStateCallback();
  }

  action_dapai(dapai: any) {
    if (this._callback) this._callback();
    this.updateStateCallback();
  }

  userDiscard(p: string) {
    if (this._callback) {
      const cb = this._callback;
      this._callback = null;
      cb({ dapai: p });
    }
  }

  action_kaiju(kaiju: any) { if (this._callback) this._callback(); }
  action_qipai(qipai: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_fulou(fulou: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_gang(gang: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_hule(hule: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_pingju(pingju: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
  action_jieju(paipu: any) { if (this._callback) this._callback(); this.updateStateCallback(); }
}

export class MahjongEngine {
  public game: Game;
  public humanPlayer: HumanPlayer;

  constructor(onStateChange: () => void) {
    this.humanPlayer = new HumanPlayer(0, onStateChange);
    const cpu1 = new CPUPlayer(1, onStateChange);
    const cpu2 = new CPUPlayer(2, onStateChange);
    const cpu3 = new CPUPlayer(3, onStateChange);
    
    // Players array order determines seating. index 0 is qijia if not specified, 
    // but majiang-core assigns _id=0 to players[0].
    this.game = new Game([this.humanPlayer, cpu1, cpu2, cpu3]);
  }

  start() {
    this.game.kaiju();
  }

  getGameState(): GameState {
    const model = this.game.model;
    const zhuangfeng = ["東", "南", "西", "北"][model.zhuangfeng] || "東";
    const jushu = model.jushu + 1;
    const kyoku = `${zhuangfeng}${jushu}局`;
    const honba = model.changbang;
    
    // Human player is at _id 0
    const humanMenfeng = this.humanPlayer._menfeng;
    let tehai: string[] = [];
    let tsumo: string | null = null;
    
    if (this.humanPlayer.shoupai) {
      const paistr = this.humanPlayer.shoupai.toString();
      tehai = parseTiles(paistr);
      // Remove the tsumo tile from tehai array if it exists
      if (this.humanPlayer.shoupai._zimo && this.humanPlayer.shoupai._zimo.length <= 2) {
         tsumo = this.humanPlayer.shoupai._zimo;
         const tsumoIndex = tehai.lastIndexOf(tsumo);
         if (tsumoIndex !== -1) {
             tehai.splice(tsumoIndex, 1);
         }
      }
    }

    // He (discards)
    const getKawa = (offset: number) => {
      // player 0 is human, 1 is shimocha, 2 is toimen, 3 is kamicha
      const targetId = (0 + offset) % 4;
      // find menfeng of targetId
      // The `model.he` is indexed by menfeng
      let targetMenfeng = 0;
      for (let i = 0; i < 4; i++) {
         if (model.player_id[i] === targetId) {
             targetMenfeng = i;
             break;
         }
      }
      if (model.he && model.he[targetMenfeng]) {
        return model.he[targetMenfeng]._pai.map((p: string) => p.replace(/[\+\=\-\*\_]/g, ''));
      }
      return [];
    };

    return {
      kyoku,
      honba,
      turn: model.he && model.he[0] ? model.he[0]._pai.length + 1 : 1,
      tehai,
      tsumo,
      kawa: {
        player: getKawa(0),
        shimocha: getKawa(1),
        toimen: getKawa(2),
        kamicha: getKawa(3)
      }
    };
  }
}

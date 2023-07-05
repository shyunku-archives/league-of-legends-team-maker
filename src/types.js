import { getTierStrength, rankKoreanString, tierKoreanString } from "./util";

export class RiotUser {
  constructor(name) {
    this.name = name;
    this.id = ""; // encrypted summoner id
    this.accountId = ""; // encrypted account id
    this.puuid = ""; // encrypted puuid
    this.profileIconId = 0;
    this.summonerLevel = 0;
    /**
     * @type {Tier}
     */
    this.sr_tier = null; // solo rank tier
    /**
     * @type {Tier}
     */
    this.fr_tier = null; // flex rank tier

    this.masteries = [];
  }

  getRepresentativeTier() {
    if (this.sr_tier) {
      return this.sr_tier.tier;
    } else if (this.fr_tier) {
      return this.fr_tier.tier;
    } else {
      return null;
    }
  }

  getRepresentativeStrength() {
    if (this.sr_tier) {
      return this.sr_tier.getStrength();
    } else if (this.fr_tier) {
      return this.fr_tier.getStrength();
    } else {
      return 0;
    }
  }
}

export class Mastery {
  constructor(championId, championLevel, championPoints) {
    this.championId = championId;
    this.championLevel = championLevel;
    this.championPoints = championPoints;
  }
}

export class Tier {
  constructor(tier, rank, lp, wins, losses) {
    this.tier = tier; // tier: silver, gold, ...
    this.rank = rank; // rank: I, II, III, IV
    this.lp = lp;
    this.wins = wins;
    this.losses = losses;
  }

  getTierRankString() {
    return `${this.tier} ${this.rank}`;
  }

  getTierRankKoreanString() {
    return `${this.getTierKoreanString()} ${this.getRankKoreanString()}`;
  }

  getTierKoreanString() {
    return tierKoreanString(this.tier);
  }

  getRankKoreanString() {
    return rankKoreanString(this.rank);
  }

  getStrength() {
    return getTierStrength(this.tier, this.rank);
  }
}

import { ContextMenu, useContextMenu } from "molecules/CustomContextMenu";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoRemoveCircle, IoArrowForward, IoArrowBack, IoRefresh } from "react-icons/io5";
import { RiotUser, Tier, ValidTierRanks, ValidTiers, toRelativeTime } from "types";
import { masteryKoreanPoints } from "util";
import { numberToRank } from "util";
import "./PlayerCard.scss";
import JsxUtil from "utils/JsxUtil";

const PlayerCard = ({
  user,
  team = 0,
  userMap,
  setUserMap,
  ddragonURL,
  championMap,
  onRemovePlayer,
  onMovePlayer,
  onUpdatePlayer,
  onPlayerDragStart,
  onPlayerDragEnd,
  onMovePlayerToQueue,
}) => {
  const profileImageURL = useMemo(
    () => `${ddragonURL}/img/profileicon/${user?.profileIconId}.png`,
    [user?.profileIconId, ddragonURL]
  );

  const [p, setP] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setP((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const playerCtx = useContextMenu({});
  const playerExTierDropdownCtx = useContextMenu({});

  const isOnQueue = useMemo(() => {
    return team !== 1 && team !== 2;
  }, [team]);
  const isAllTierVisible = useMemo(() => {
    return user?.ex_tier != null && user?.sr_tier != null && user?.fr_tier != null;
  }, [user?.ex_tier, user?.sr_tier, user?.fr_tier]);
  const flattenedValidTierRanks = useMemo(() => {
    return ValidTierRanks.flatten().reverse();
  }, []);

  const setExTier = (newTier) => {
    setUserMap((prev) => {
      const newMap = { ...prev };
      newMap[user?.puuid] = newMap[user?.puuid] ?? new RiotUser(user?.puuid);
      newMap[user?.puuid].ex_tier = newTier;
      return newMap;
    });
    playerExTierDropdownCtx.closer();
  };

  const removeExTier = () => {
    if (userMap[user?.puuid] == null) return;
    setUserMap((prev) => {
      const newMap = { ...prev };
      newMap[user?.puuid] = newMap[user?.puuid] ?? new RiotUser(user?.puuid);
      newMap[user?.puuid].ex_tier = null;
      return newMap;
    });
    playerCtx.closer();
  };

  return (
    <>
      <ContextMenu defaultStyle className="player-menu" reference={playerCtx.ref}>
        {!isOnQueue && (
          <div className="player-menu-item" onClick={(e) => onMovePlayerToQueue(e, user?.puuid)}>
            대기열로 이동
          </div>
        )}
        <div onClick={playerExTierDropdownCtx.opener}>{user?.ex_tier != null ? "지정 랭크 변경" : "랭크 지정"}</div>
        {user?.ex_tier != null && (
          <div className="player-menu-item" onClick={removeExTier}>
            지정 랭크 제거
          </div>
        )}
      </ContextMenu>
      <ContextMenu defaultStyle sticky className="player-ex-tier-dropdown" reference={playerExTierDropdownCtx.ref}>
        {flattenedValidTierRanks.map((tierRank, ind) => {
          const [tier, rank] = tierRank?.split(" ") ?? ["", ""];
          const exTier = new Tier(tier, rank);
          return (
            <div className="player-ex-tier-dropdown-item" key={ind} onClick={(e) => setExTier(exTier)}>
              <div className={"tier-rank tier " + tier.toLowerCase()}>{exTier.getTierRankKoreanStringWithoutLP()}</div>
            </div>
          );
        })}
      </ContextMenu>
      <div
        className="team-member player"
        draggable={true}
        ref={playerCtx.openerRef}
        onDragStart={(e) => onPlayerDragStart(e, user?.puuid)}
        onDragEnd={onPlayerDragEnd}
        onContextMenu={playerCtx.opener}
      >
        <div className="team-member-profile-image">
          <img src={profileImageURL}></img>
          <div className="team-member-level">{user?.summonerLevel}</div>
        </div>
        {/* {user?.getRepresentativeStrength()} */}
        <div className="team-member-detail">
          <div className="team-member-detail-group">
            <div className="team-member-name">{user?.name}</div>
            <div className="team-member-update-time">{toRelativeTime(user?.lastUpdateTime)}</div>
          </div>
          <div className="team-member-ranks">
            {user?.ex_tier != null && (
              <div className={"team-member-rank tier " + user?.ex_tier?.tier?.toLowerCase()}>
                <div className="team-member-rank-title">지정</div>
                <div className="team-member-rank-tier">{user?.ex_tier?.getTierRankKoreanSmartString()}</div>
              </div>
            )}
            {user?.sr_tier != null && (
              <div className={"team-member-rank tier " + user?.sr_tier?.tier?.toLowerCase()}>
                <div className="team-member-rank-title">솔랭</div>
                <div className="team-member-rank-tier">{user?.sr_tier?.getTierRankKoreanSmartString()}</div>
              </div>
            )}
            {user?.fr_tier != null && !isAllTierVisible && (
              <div className={"team-member-rank tier " + user?.fr_tier?.tier?.toLowerCase()}>
                <div className="team-member-rank-title">자랭</div>
                <div className="team-member-rank-tier">{user?.fr_tier?.getTierRankKoreanSmartString()}</div>
              </div>
            )}
            <div className="team-member-lp">{user?.getRepresentativeStrength()}LP</div>
            {/* <div className="team-member-rank">
              <div className="team-member-rank-title">탑레</div>
              <div className="team-member-rank-tier">마스터</div>
            </div> */}
          </div>
        </div>
        <div className="masteries">
          {user?.masteries?.map((e, ind) => {
            const champion = championMap[e.championId];
            const championEngName = champion?.id ?? "unknown";
            const championName = champion?.name ?? "unknown";
            return (
              <div className={"mastery " + "level-" + e?.championLevel + (ind === 0 ? " best" : "")} key={ind}>
                <img src={`${ddragonURL}/img/champion/${championEngName}.png`} />
                <div className="mastery-point">{masteryKoreanPoints(e.championPoints)}</div>
              </div>
            );
          })}
        </div>
        <div className="tail">
          <div className="remove-icon tail-icon" onClick={(e) => onRemovePlayer(e, user?.puuid)}>
            <IoRemoveCircle />
          </div>
          <div className="move-icon tail-icon" onClick={(e) => onMovePlayer(e, user?.puuid, team)}>
            {team === 1 ? <IoArrowForward /> : team === 2 && <IoArrowBack />}
          </div>
          <div className="update-icon tail-icon" onClick={(e) => onUpdatePlayer(e, user)}>
            <IoRefresh />
          </div>
        </div>
      </div>
    </>
  );
};

export default PlayerCard;

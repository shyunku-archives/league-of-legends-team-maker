import { useEffect, useMemo, useRef, useState } from "react";
import { getLatestDataDragonURL, getSummonerAllInfo } from "./thunks";
import {
  IoArrowUp,
  IoCalculator,
  IoRemoveCircle,
  IoShuffle,
  IoSwapHorizontal,
  IoArrowForward,
  IoArrowBack,
  IoArrowDown,
  IoRefresh,
  IoClose,
} from "react-icons/io5";
import {
  getTierRankByStrength,
  getTierRankKoreanStringByStrength,
  masteryKoreanPoints,
  numberToRank,
  tierRankKoreanString,
} from "./util";
import PackageJson from "../package.json";
import axios, { AxiosError } from "axios";
import { RiotUser, Tier, toRelativeTime } from "./types";
import toast from "react-hot-toast";

function App() {
  const [initialized, setInitialized] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [summonerNameInput, setSummonerNameInput] = useState("");

  const [dragging, setDragging] = useState(false);
  const [droppingTeam1, setDroppingTeam1] = useState(false);
  const [droppingTeam2, setDroppingTeam2] = useState(false);
  const [team1players, setTeam1Players] = useState({});
  const [team2players, setTeam2Players] = useState({});
  const [playerQueue, setPlayerQueue] = useState({});

  const [ddragonURL, setDdragonURL] = useState("");
  const [championMap, setChampionMap] = useState({});

  const team1AvgStrength = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (let e in team1players) {
      const user = userMap[e];
      if (user == null) continue;
      if (user.getRepresentativeStrength() === 0) continue;
      sum += user.getRepresentativeStrength();
      count++;
    }
    if (count === 0) return 0;
    return sum / count;
  }, [team1players, userMap]);

  const team2AvgStrength = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (let e in team2players) {
      const user = userMap[e];
      if (user == null) continue;
      if (user.getRepresentativeStrength() === 0) continue;
      sum += user.getRepresentativeStrength();
      count++;
    }
    if (count === 0) return 0;
    return sum / count;
  }, [team2players, userMap]);

  const team1TierRank = useMemo(() => {
    return getTierRankByStrength(team1AvgStrength);
  }, [team1AvgStrength]);

  const team2TierRank = useMemo(() => {
    return getTierRankByStrength(team2AvgStrength);
  }, [team2AvgStrength]);

  const isReady = useMemo(() => {
    return ddragonURL !== "";
  }, [ddragonURL]);

  useEffect(() => {
    if (!initialized) {
      let isInitial =
        Object.keys(userMap).length === 0 &&
        Object.keys(team1players).length === 0 &&
        Object.keys(team2players).length === 0 &&
        Object.keys(playerQueue).length === 0;
      if (isInitial) {
        const userMapStr = localStorage.getItem("userMap");
        const team1playersStr = localStorage.getItem("team1players");
        const team2playersStr = localStorage.getItem("team2players");
        const playerQueueStr = localStorage.getItem("playerQueue");

        if (userMapStr != null) {
          try {
            const userMapObj = JSON.parse(userMapStr);
            const refinedUserMapObj = Object.keys(userMapObj).reduce((acc, cur) => {
              const user = userMapObj[cur];
              if (user == null) return acc;
              acc[cur] = RiotUser.fromObject(user);
              return acc;
            }, {});
            console.log(refinedUserMapObj);
            setUserMap(refinedUserMapObj);
          } catch (err) {
            console.error(err);
          }
        }
        if (team1playersStr != null) {
          const team1playersObj = JSON.parse(team1playersStr);
          console.log(team1playersObj);
          setTeam1Players(team1playersObj);
        }
        if (team2playersStr != null) {
          const team2playersObj = JSON.parse(team2playersStr);
          console.log(team2playersObj);
          setTeam2Players(team2playersObj);
        }
        if (playerQueueStr != null) {
          const playerQueueObj = JSON.parse(playerQueueStr);
          console.log(playerQueueObj);
          setPlayerQueue(playerQueueObj);
        }
        setInitialized(true);
      }
    }
    localStorage.setItem("userMap", JSON.stringify(userMap));
    localStorage.setItem("team1players", JSON.stringify(team1players));
    localStorage.setItem("team2players", JSON.stringify(team2players));
    localStorage.setItem("playerQueue", JSON.stringify(playerQueue));
  }, [userMap, team1players, team2players, initialized, playerQueue]);

  useEffect(() => {
    (async () => {
      const url = await getLatestDataDragonURL();
      setDdragonURL(url);

      try {
        const championsResp = await axios.get(`${url}/data/ko_KR/champion.json`);
        const champions = championsResp.data.data;
        const map = Object.keys(champions).reduce((acc, cur) => {
          const champion = champions[cur];
          acc[champion.key] = champion;
          return acc;
        }, {});
        setChampionMap(map);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const onSearch = async (name = "") => {
    const input = name === "" ? summonerNameInput : name;
    const isUpdate = name !== "";
    if (input === "") return;
    let alreadyExists = Object.keys(userMap).includes(input);
    if (!isUpdate && alreadyExists) {
      toast.error(`"${input}"는/은 이미 추가된 소환사입니다.`);
      setSummonerNameInput("");
      return;
    }

    try {
      const res = await getSummonerAllInfo(input);
      setUserMap((prev) => ({ ...prev, [res.name]: res }));
      if (!alreadyExists) {
        setPlayerQueue((prev) => ({ ...prev, [res.name]: true }));
      }
      setSummonerNameInput("");
      toast.success("추가 완료!");
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err);
        console.log(err.response);
        console.log(JSON.stringify(err));
        toast.error("소환사 정보를 가져오는데 실패했습니다.");
      } else {
        toast.error("오류가 발생했습니다!");
      }
    }
  };

  const onRemovePlayer = (username) => {
    setUserMap((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
    setTeam1Players((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
    setTeam2Players((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
  };

  const onMovePlayer = (username, team) => {
    if (team === 1) {
      setTeam1Players((prev) => {
        const newMap = { ...prev };
        delete newMap[username];
        return newMap;
      });
      setTeam2Players((prev) => ({ ...prev, [username]: true }));
    } else {
      setTeam2Players((prev) => {
        const newMap = { ...prev };
        delete newMap[username];
        return newMap;
      });
      setTeam1Players((prev) => ({ ...prev, [username]: true }));
    }
  };

  const onPlayerDragStart = (e, username) => {
    // e.preventDefault();
    setDragging(true);
    // e.target.classList.add("grabbing");
    e.dataTransfer.setData("text/plain", username);
    console.log("-> drag start", e.target);
  };

  const onPlayerDragEnd = (e) => {
    setDragging(false);
    // e.target.classList.remove("grabbing");
    console.log("<- drag end", e.target);
  };

  const onPlayerRightClick = (e, username) => {
    e.preventDefault();
    setPlayerQueue((prev) => ({ ...prev, [username]: true }));
    setTeam1Players((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
    setTeam2Players((prev) => {
      const newMap = { ...prev };
      delete newMap[username];
      return newMap;
    });
  };

  // team1
  const onTeam1DragEnter = (e) => {
    e.preventDefault();
    setDroppingTeam1(true);
  };

  const onTeam1DragLeave = (e) => {
    e.preventDefault();
    setDroppingTeam1(false);
  };

  const onTeam1DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("team1 drag over", e.target);
  };

  const onTeam1Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDroppingTeam1(false);

    const draggingUsername = e.dataTransfer.getData("text/plain");
    console.log("team1 add", draggingUsername);
    setTeam1Players((prev) => ({ ...prev, [draggingUsername]: true }));
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[draggingUsername];
      return newMap;
    });
  };

  //team2
  const onTeam2DragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDroppingTeam2(true);
  };

  const onTeam2DragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDroppingTeam2(false);
  };

  const onTeam2DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("team2 drag over", e.target);
  };

  const onTeam2Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    setDroppingTeam2(false);

    const draggingUsername = e.dataTransfer.getData("text/plain");
    console.log("team2 add", draggingUsername);
    setTeam2Players((prev) => ({ ...prev, [draggingUsername]: true }));
    setPlayerQueue((prev) => {
      const newMap = { ...prev };
      delete newMap[draggingUsername];
      return newMap;
    });
  };

  const swapTeams = () => {
    const newTeam1 = { ...team2players };
    const newTeam2 = { ...team1players };
    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
  };

  const combine10Players = () => {
    const team1 = { ...team1players };
    const team2 = { ...team2players };
    const queue = { ...playerQueue };

    const combined = Object.keys(team1).concat(Object.keys(team2)).concat(Object.keys(queue));
    combined.sort(() => Math.random() - 0.5);

    const newTeam1 = {};
    const newTeam2 = {};

    for (let i = 0; i < combined.length && i < 10; i++) {
      if (i % 2 === 0) {
        newTeam1[combined[i]] = true;
      } else {
        newTeam2[combined[i]] = true;
      }
    }

    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
    setPlayerQueue({});
  };

  const shufflePlayers = () => {
    const newTeam1 = { ...team1players };
    const newTeam2 = { ...team2players };

    const shuffledPlayers = Object.keys(newTeam1).concat(Object.keys(newTeam2));
    shuffledPlayers.sort(() => Math.random() - 0.5);

    const newTeam1Players = shuffledPlayers.slice(0, Object.keys(newTeam1).length);
    const newTeam2Players = shuffledPlayers.slice(Object.keys(newTeam1).length);

    console.log(newTeam1Players, newTeam2Players);

    const newTeam1Map = newTeam1Players.reduce((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {});
    const newTeam2Map = newTeam2Players.reduce((acc, cur) => {
      acc[cur] = true;
      return acc;
    }, {});

    setTeam1Players(newTeam1Map);
    setTeam2Players(newTeam2Map);
  };

  const combinateTeamByStrengthWithBalance = () => {
    const team1 = { ...team1players };
    const team2 = { ...team2players };
    const combined = Object.keys(team1).concat(Object.keys(team2));
    combined.sort((a, b) => {
      const userA = userMap[a];
      const userB = userMap[b];
      if (userA == null || userB == null) return 0;
      const userAStrength = userA.getRepresentativeStrength();
      const userBStrength = userB.getRepresentativeStrength();
      if (userAStrength === userBStrength) {
        return Math.random() - 0.5;
      }
      return userBStrength - userAStrength;
    });

    const newTeam1 = {};
    const newTeam2 = {};

    // distribute
    const zeroOr1 = Math.random() < 0.5 ? 0 : 1;
    for (let i = 0; i < combined.length; i++) {
      if (i % 2 === zeroOr1) {
        newTeam1[combined[i]] = true;
      } else {
        newTeam2[combined[i]] = true;
      }
    }

    setTeam1Players(newTeam1);
    setTeam2Players(newTeam2);
  };

  const moveAllToQueue = () => {
    const newQueue = { ...playerQueue };
    const team1 = { ...team1players };
    const team2 = { ...team2players };

    Object.keys(team1).forEach((e) => {
      newQueue[e] = true;
    });
    Object.keys(team2).forEach((e) => {
      newQueue[e] = true;
    });

    setPlayerQueue(newQueue);
    setTeam1Players({});
    setTeam2Players({});
  };

  const removeAll = () => {
    setUserMap({});
    setPlayerQueue({});
    setTeam1Players({});
    setTeam2Players({});
  };

  const playerProps = {
    ddragonURL: ddragonURL,
    championMap,
    userMap,
    setUserMap,
    onRemovePlayer: onRemovePlayer,
    onMovePlayer: onMovePlayer,
    onUpdatePlayer: onSearch,
    onPlayerDragStart: onPlayerDragStart,
    onPlayerDragEnd: onPlayerDragEnd,
    onPlayerRightClick: onPlayerRightClick,
  };

  // console.log(userMap);

  return (
    <div className="App">
      <div className="main-content">
        <header></header>
        <div className="title">LOL 사용자 설정 게임 팀 구성 {PackageJson.version}v</div>
        <div className="description">
          본 서비스는 리그오브레전드의 사용자 설정 게임에서 팀 인원 분배를 도와주는 툴 및 기능을 제공합니다.
          <br />
          사용자 설정 게임은 2명 이상의 플레이어들이 팀을 구성하여 게임을 진행하는 방식으로,
          <br />
          플레이어들은 팀을 구성할 때 플레이어들의 레벨, 티어, 실력 등을 고려하여 팀을 구성합니다.
          <br />
          이러한 과정은 여러가지 방법을 통해 진행되나 이는 번거롭고 시간이 많이 소요되는 작업입니다.
          <br />본 서비스는 이러한 번거로움을 줄이고자 여러 기능을 제공합니다.{" "}
          <span style={{ color: "#5080F050", fontWeight: "bold" }}>by shyunku</span>
        </div>
        <div className="description additional">
          하단의 소환사 검색창에 소환사명 입력 후 엔터를 누르면 대기열에 추가됩니다.
          <br />
          대기열에 추가된 소환사나 팀애 배치된 소환사는 드래그 앤 드롭을 통해 팀 또는 대기열에 재배치할 수 있습니다.
        </div>
        <div className="player-searcher" style={{ visibility: isReady ? "visible" : "hidden" }}>
          <input
            placeholder="소환사 검색으로 대기열에 추가"
            spellCheck={false}
            value={summonerNameInput}
            onChange={(e) => setSummonerNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch();
              }
            }}
          />
        </div>
        <div className="functions">
          <div className="function best" onClick={combinateTeamByStrengthWithBalance}>
            <div className="icon">
              <IoCalculator />
            </div>
            <div className="name">최적의 조합</div>
          </div>
          <div className="function" onClick={combine10Players}>
            <div className="icon">
              <IoArrowUp />
            </div>
            <div className="name">10명 구성</div>
          </div>
          <div className="function" onClick={swapTeams}>
            <div className="icon">
              <IoSwapHorizontal />
            </div>
            <div className="name">팀 스왑하기</div>
          </div>
          <div className="function" onClick={shufflePlayers}>
            <div className="icon">
              <IoShuffle />
            </div>
            <div className="name">소환사 섞기</div>
          </div>
          <div className="function" onClick={moveAllToQueue}>
            <div className="icon">
              <IoArrowDown />
            </div>
            <div className="name">전부 대기열로 이동</div>
          </div>
          <div className="function negative" onClick={removeAll}>
            <div className="icon">
              <IoClose />
            </div>
            <div className="name">전부 제거</div>
          </div>
        </div>
        <div className="team-composition">
          <div
            className={"team team-1 " + (droppingTeam1 ? "dropping" : "") + (dragging ? " dragging" : "")}
            onDragEnter={onTeam1DragEnter}
            onDragLeave={onTeam1DragLeave}
            onDragOver={onTeam1DragOver}
            onDrop={onTeam1Drop}
          >
            <div className="header">
              <div className="team-title">팀 1</div>
              {team1TierRank?.tier != null && (
                <div className={"team-strength tier " + team1TierRank?.tier?.toLowerCase?.()}>
                  평균 {tierRankKoreanString(team1TierRank?.tier, team1TierRank?.rank)}
                </div>
              )}
            </div>
            <div className="team-members">
              <div className="filter">팀 1에 추가</div>
              {Object.keys(team1players)
                .filter((e) => userMap[e] != null)
                .map((e, ind) => (
                  <Player key={ind} user={userMap[e] ?? null} team={1} {...playerProps} />
                ))}
            </div>
          </div>
          <div
            className={"team team-2 " + (droppingTeam2 ? "dropping" : "") + (dragging ? " dragging" : "")}
            onDragEnter={onTeam2DragEnter}
            onDragLeave={onTeam2DragLeave}
            onDragOver={onTeam2DragOver}
            onDrop={onTeam2Drop}
          >
            <div className="header">
              <div className="team-title">팀 2</div>
              {team2TierRank?.tier != null && (
                <div className={"team-strength tier " + team2TierRank?.tier?.toLowerCase?.()}>
                  평균 {tierRankKoreanString(team2TierRank?.tier, team2TierRank?.rank)}
                </div>
              )}
            </div>
            <div className="team-members">
              <div className="filter">팀 2에 추가</div>
              {Object.keys(team2players)
                .filter((e) => userMap[e] != null)
                .map((e, ind) => (
                  <Player key={ind} user={userMap[e] ?? null} team={2} {...playerProps} />
                ))}
            </div>
          </div>
        </div>
        <div className="player-queue">
          <div className="player-queue-title">대기열</div>
          <div className="player-queue-members">
            {Object.keys(playerQueue)
              .filter((e) => userMap[e] != null)
              .map((e, ind) => (
                <Player key={ind} user={userMap[e] ?? null} {...playerProps} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const Player = ({
  user,
  team,
  userMap,
  setUserMap,
  ddragonURL,
  championMap,
  onRemovePlayer,
  onMovePlayer,
  onUpdatePlayer,
  onPlayerDragStart,
  onPlayerDragEnd,
  onPlayerRightClick,
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

  const isAllTierVisible = useMemo(() => {
    return user?.ex_tier != null && user?.sr_tier != null && user?.fr_tier != null;
  }, [user?.ex_tier, user?.sr_tier, user?.fr_tier]);

  const setExTier = () => {
    if (userMap[user?.name] == null) return;
    const input = prompt("지정 티어를 입력하세요. (예: Diamond 1)");
    if (input == null) return;
    try {
      if (input === "") {
        setUserMap((prev) => {
          const newMap = { ...prev };
          newMap[user?.name] = newMap[user?.name] ?? new RiotUser(user?.name);
          newMap[user?.name].ex_tier = null;
          return newMap;
        });
      } else {
        const [tierRaw, rankRaw] = input.split(" ");
        let tier = tierRaw.toUpperCase();
        let rank = numberToRank(parseInt(rankRaw));
        if (rank === "") throw new Error();
        const newTier = new Tier(tier, rank, 0, 0, 0);

        setUserMap((prev) => {
          const newMap = { ...prev };
          newMap[user?.name] = newMap[user?.name] ?? new RiotUser(user?.name);
          newMap[user?.name].ex_tier = newTier;
          return newMap;
        });
      }
    } catch (err) {
      toast.error("잘못된 입력입니다.");
    }
  };

  return (
    <div
      className="team-member player"
      draggable={true}
      onDragStart={(e) => onPlayerDragStart(e, user?.name)}
      onDragEnd={onPlayerDragEnd}
      onContextMenu={(e) => onPlayerRightClick(e, user?.name)}
      onClick={setExTier}
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
              <div className="team-member-rank-tier">{user?.ex_tier?.getTierRankKoreanString()}</div>
            </div>
          )}
          {user?.sr_tier != null && (
            <div className={"team-member-rank tier " + user?.sr_tier?.tier?.toLowerCase()}>
              <div className="team-member-rank-title">솔랭</div>
              <div className="team-member-rank-tier">{user?.sr_tier?.getTierRankKoreanString()}</div>
            </div>
          )}
          {user?.fr_tier != null && !isAllTierVisible && (
            <div className={"team-member-rank tier " + user?.fr_tier?.tier?.toLowerCase()}>
              <div className="team-member-rank-title">자랭</div>
              <div className="team-member-rank-tier">{user?.fr_tier?.getTierRankKoreanString()}</div>
            </div>
          )}
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
        <div className="remove-icon tail-icon" onClick={(e) => onRemovePlayer(user?.name)}>
          <IoRemoveCircle />
        </div>
        <div className="move-icon tail-icon" onClick={(e) => onMovePlayer(user?.name, team)}>
          {team === 1 ? <IoArrowForward /> : team === 2 && <IoArrowBack />}
        </div>
        <div className="update-icon tail-icon" onClick={(e) => onUpdatePlayer(user?.name)}>
          <IoRefresh />
        </div>
      </div>
    </div>
  );
};

export default App;

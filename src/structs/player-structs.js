const HomeAway = {
    HOME: 0,
    AWAY: 1
}
exports.HomeAway = HomeAway;

class SetScore {

    constructor(homeScore, awayScore) {
        let self = this;

        self._homeScore = homeScore;
        self._awayScore = awayScore;
    }

    isFinished() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        let mxScore = Math.max(homeScore, awayScore);
        let mnScore = Math.min(homeScore, awayScore);

        if (mxScore < 6) { return false; }

        let scoreDiff = mxScore - mnScore;
        if (mxScore == 6 && scoreDiff < 2) { return false; }

        return true;
    }

    isNormalSet() {
        return true;
    }

    isExtendedTiebreak() {
        return false;
    }

    getWinningSide() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        if (!self.isFinished()) { return null; }

        return homeScore > awayScore ? HomeAway.HOME : HomeAway.AWAY;
    }

    getHomeScore() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        if (awayScore >= 5) { return Math.min(7, homeScore); }

        return Math.min(6, homeScore);
    }

    getAwayScore() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        if (homeScore >= 5) { return Math.min(7, awayScore); }

        return Math.min(6, awayScore);
    }

    toString() {
        return 'SetScore{_homeScore=' + this._homeScore + ',_awayScore=' + this._awayScore + '}';
    }
}
exports.SetScore = SetScore;

class ExtendedTiebreakScore {

    constructor(homeScore, awayScore) {
        let self = this;
        self._homeScore = homeScore;
        self._awayScore = awayScore;
    }

    isFinished() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        let mxScore = Math.max(homeScore, awayScore);
        let mnScore = Math.min(homeScore, awayScore);

        let scoreDiff = mxScore - mnScore;

        if (mxScore < 10) { return false; }
        if (mxScore >= 10 && scoreDiff < 2) { return false; }

        return true;
    }

    getWinningSide() {
        let self = this;

        let homeScore = self._homeScore;
        let awayScore = self._awayScore;

        if (!self.isFinished()) { return null; }

        return homeScore > awayScore ? HomeAway.HOME : HomeAway.AWAY;
    }

    getHomeScore() {
        return this._homeScore;
    }

    getAwayScore() {
        return this._awayScore;
    }

    isNormalSet() {
        return false;
    }

    isExtendedTiebreak() {
        return true;
    }
}
exports.ExtendedTiebreakScore = ExtendedTiebreakScore;

class Team {

    constructor(teamId) {
        let self = this;

        self._teamId = teamId;
    }

    get id() {
        return this._teamId
    }

    toString() {
        return 'Team{_teamId=' + this._teamId + '}';
    }
}
exports.Team = Team;


class FinishedMatch {

    constructor(homeTeam, awayTeam, setScores, forfeitSide=null) {
        let self = this;

        if (homeTeam == null) { throw new Error('Home team is not defined!'); }
        if (awayTeam == null) { throw new Error('Away team is not defined!'); }

        self._homeTeam = homeTeam;
        self._awayTeam = awayTeam;
        self._setScores = setScores;
        self._forfeitSide = forfeitSide;
    }

    get homeTeam() {
        return this._homeTeam;
    }

    get awayTeam() {
        return this._awayTeam;
    }

    getWinningSideId() {
        let self = this;

        let homeTeam = self._homeTeam;

        let winningTeam = self.getWinner();
        return winningTeam == homeTeam ? HomeAway.HOME : HomeAway.AWAY;
    }

    getHomePoints() {
        let self = this;
        return self.getTeamPoints(HomeAway.HOME);
    }

    getAwayPoints() {
        let self = this;
        return self.getTeamPoints(HomeAway.AWAY);
    }

    getTeamPoints(sideId) {
        let self = this;

        let homeTeam = self._homeTeam;
        let forfeitSide = self._forfeitSide;

        let winner = self.getWinner();

        // special case - pre-match forefeit
        if (self._isPrematchForefeit()) {
            return sideId == forfeitSide ? 0 : 3;
        }

        if (sideId == HomeAway.HOME) {
            return winner == homeTeam ? 3 : 1;
        } else {
            return winner == homeTeam ? 1 : 3;
        }
    }

    getHomeGames() {
        let self = this;
        return self.getTeamGames(HomeAway.HOME);
    }

    getAwayGames() {
        let self = this;
        return self.getTeamGames(HomeAway.AWAY);
    }

    getTeamGames(sideId) {
        let self = this;

        let setScores = self._setScores;
        let forfeitSideId = self._forfeitSide;

        // pre-match forfeit
        if (self._isPrematchForefeit()) {
            return sideId == forfeitSideId ? 6 : 12;
        }

        // mid-game forfeit
        let isForfeit = forfeitSideId != null;
        if (isForfeit) {
            let winningSideId = 1 - forfeitSideId;

            let setCountVec = [0, 0];
            let gameCountVec = [0, 0];

            for (let set of setScores) {
                if (set.isFinished()) {
                    if (set.isNormalSet()) {
                        gameCountVec[0] += set.getHomeScore();
                        gameCountVec[1] += set.getAwayScore();
                    } else if (set.isExtendedTiebreak()) {
                        let winningSideId = set.getWinningSide();
                        gameCountVec[winningSideId] += 1;
                    } else {
                        throw new Error('Unknown set: ' + set.toString());
                    }

                    let winningSideId = set.getWinningSide();
                    ++setCountVec[winningSideId];
                } else {
                    ++setCountVec[winningSideId];
                    if (set.isNormalSet()) {
                        let currSetScoreVec = [set.getHomeScore(), set.getAwayScore()];
                        currSetScoreVec[winningSideId] = Math.max(4, currSetScoreVec[forfeitSideId]) + 2;
                        gameCountVec[0] += currSetScoreVec[0];
                        gameCountVec[1] += currSetScoreVec[1];
                    } else if (set.isExtendedTiebreak()) {
                        ++gameCountVec[winningSideId];
                    } else {
                        throw new Error('Unknown set: ' + set.toString());
                    }
                }
            }

            // fill in any missing sets
            while (setCountVec[0] + setCountVec[1] < 2) {
                gameCountVec[winningSideId] += 6;
                ++setCountVec[winningSideId];
            }

            // extended tie-break
            if (setCountVec[0] == setCountVec[1]) {
                ++gameCountVec[winningSideId];
                ++setCountVec[winningSideId];
            }

            return gameCountVec[sideId];
        }

        // normal match
        let gameCount = [0, 0];
        for (let setScore of setScores) {
            if (setScore.isNormalSet()) {
                gameCount[0] += setScore.getHomeScore();
                gameCount[1] += setScore.getAwayScore();
            } else if (setScore.isExtendedTiebreak()) {
                let winningSideId = setScore.getWinningSide();
                ++gameCount[winningSideId];
            } else {
                throw new Error('Unknown set: ' + setScore.toString());
            }
        }

        return gameCount[sideId];
    }


    getWinner() {
        let self = this;

        let homeTeam = self._homeTeam;
        let awayTeam = self._awayTeam;
        let forfeitSideId = self._forfeitSide;
        let setScores = self._setScores;

        let setCountVec = [0, 0];

        if (forfeitSideId != null) {
            return forfeitSideId == HomeAway.HOME ? self._awayTeam : self._homeTeam;
        }

        for (let setScore of setScores) {
            let setWinner = setScore.getWinningSide();

            if (setWinner == HomeAway.HOME) {
                ++setCountVec[0];
            } else {
                ++setCountVec[1];
            }
        }

        let mxSetsWon = Math.max(...setCountVec);
        if (mxSetsWon < 2) { throw new Error('The match did not finish!'); }

        let winner = setCountVec[0] > setCountVec[1] ? homeTeam : awayTeam;

        return winner;
    }

    getSetScores() {
        return this._setScores;
    }

    _isPrematchForefeit() {
        let self = this;

        let forfeitSide = self._forfeitSide;
        let setScores = self._setScores;

        return forfeitSide != null && setScores == null;
    }

    isForfeit() {
        let self = this;
        let forfeitSide = self._forfeitSide;
        return forfeitSide != null;
    }

    toString() {
        return 'FinishedMatch{_homeTeam=' + this._homeTeam.toString() + ',_awayTeam=' + this.awayTeam.toString() + ',_setScores=' + this._setScores + ',_forfeitSide=' + this._forfeitSide + ',winner=' + this.getWinner().id + '}'
    }
}
exports.FinishedMatch = FinishedMatch;

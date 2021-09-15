const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const structs = require('../src/structs/player-structs.js');

function extractMatches(inputFName) {
    console.log('reading file: ' + inputFName);
    let inputHtml = fs.readFileSync(inputFName);
    const $ = cheerio.load(inputHtml);

    let matches = [];
    let teamMap = new Map();

    // let matchDiv = $('.tekma')
    $('.tekma').each(function (idx, elem) {
        let matchDiv = $(this);
        let team1Div = matchDiv.find('.tekmovalec1');
        let team2Div = matchDiv.find('.tekmovalec2');

        let team1Id = team1Div.text().trim();
        let team2Id = team2Div.text().trim();

        if (!teamMap.has(team1Id)) { teamMap.set(team1Id, new structs.Team(team1Id)); }
        if (!teamMap.has(team2Id)) { teamMap.set(team2Id, new structs.Team(team2Id)); }

        let homeTeam = teamMap.get(team1Id);
        let awayTeam = teamMap.get(team2Id);

        // check if the match was forfeighted
        let forfeightDiv = matchDiv.find('.special');
        if (forfeightDiv.length > 0) {
            // the match was forfeighted
            let forfeightText = forfeightDiv.text().trim();

            if (forfeightText == 'Predaja igralec 2') {
                matches.push(new structs.FinishedMatch(homeTeam, awayTeam, null, structs.HomeAway.AWAY));
            } else if (forfeightText == 'Predaja igralec 1') {
                matches.push(new structs.FinishedMatch(homeTeam, awayTeam, null, structs.HomeAway.HOME));
            } else if (forfeightText == 'BB') {
                // "Brez Boja" - the match didn't happen and no points were awarded
                return;
            } else {
                throw new Error('Invalid forfeight text: ' + forfeightText);
            }

            return
        }

        // check if the match was played
        let scoreDiv = matchDiv.find('.rezultat');
        if (scoreDiv.length == 0) {
            // the match was not played
            return
        }

        let isHomeWinner = team1Div.hasClass('zmagovalec');
        let isAwayWinner = team2Div.hasClass('zmagovalec');

        let team1Set1Games = parseInt(matchDiv.find('.rezultat1').text());
        let team2Set1Games = parseInt(matchDiv.find('.rezultat2').text());
        let team1Set2Games = parseInt(matchDiv.find('.rezultat3').text());
        let team2Set2Games = parseInt(matchDiv.find('.rezultat4').text());
        let team1Set3Games = parseInt(matchDiv.find('.rezultat5').text());
        let team2Set3Games = parseInt(matchDiv.find('.rezultat6').text());

        let setScores = [
            new structs.SetScore(team1Set1Games, team2Set1Games),
            new structs.SetScore(team1Set2Games, team2Set2Games)
        ]

        if (team1Set3Games > 0 || team2Set3Games > 0) {
            setScores.push(new structs.ExtendedTiebreakScore(team1Set3Games, team2Set3Games));
        }

        // check whether the match was forfeighted
        let setWinnerCounts = [0, 0];
        for (let set of setScores) {
            let setWinnerId = set.getWinningSide();
            if (setWinnerId != null) {
                ++setWinnerCounts[setWinnerId];
            }
        }

        if (Math.max(setWinnerCounts[0], setWinnerCounts[1]) == 2) {
            matches.push(new structs.FinishedMatch(homeTeam, awayTeam, setScores));
        }
        else {
            // the score is incomplete => one of the players has forfeighted the match
            // extract the winner manually and back-fill
            let winningSideId = isHomeWinner ? structs.HomeAway.HOME : structs.HomeAway.AWAY;
            matches.push(new structs.FinishedMatch(
                homeTeam,
                awayTeam,
                setScores,
                isHomeWinner ? structs.HomeAway.AWAY : structs.HomeAway.HOME
            ))
        }
    })

    return matches;
}

function storeFile(outputFName, matches) {
    console.log('exporting ' + matches.length + ' matches to `' + outputFName + '`');

    let out = fs.createWriteStream(outputFName, { flags: 'w' });

    out.write([
        'Home Team',
        'Away Team',
        'Winner',
        'Score',
        'Is Forfeit'
    ].join(','));

    for (match of matches) {
        let homeTeam = match.homeTeam;
        let awayTeam = match.awayTeam;

        console.log('home: ' + homeTeam);
        console.log('away: ' + awayTeam);

        let setScoreVec = match.getSetScores();
        let setScoresStr = '';
        if (setScoreVec != null) {
            for (let setN = 0; setN < setScoreVec.length; ++setN) {
                let setScore = setScoreVec[setN];
                setScoresStr += setScore.getHomeScore() + ':' + setScore.getAwayScore();
                if (setN < setScoreVec.length - 1) {
                    setScoresStr += ' '
                }
            }
        }

        out.write('\n' + [
            "\"" + homeTeam.id + "\"",
            "\"" + awayTeam.id + "\"",
            "\"" + match.getWinner().id + "\"",
            setScoresStr,
            match.isForfeit()
        ].join(','))
    }
}

function main(argVec) {
    let outputFName = argVec[0];
    let inputFNames = argVec.slice(1);

    let cwd = process.cwd();

    console.log('arguments: ' + argVec.toString());

    let allMatches = [];
    for (inputFname of inputFNames) {
        let fileMatches = extractMatches(path.join(cwd, inputFname));
        allMatches = allMatches.concat(fileMatches);
    }

    storeFile(path.join(cwd, outputFName), allMatches);
}

main(process.argv.slice(2));

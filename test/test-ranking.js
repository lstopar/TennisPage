const assert = require('assert');

const structs = require('../src/structs/player-structs.js');

describe('Score tests', function () {
    describe('Test 2:0 finish', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(6, 1),
                new structs.SetScore(6, 3)
            ]
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team1');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();

        assert.equal(homePoints, 3);
        assert.equal(awayPoints, 1);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();

        assert.equal(homeGames, 12);
        assert.equal(awayGames, 4);
    })

    describe('Test 2:1 finish', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(6, 1),
                new structs.SetScore(5, 7),
                new structs.ExtendedTiebreakScore(10, 8)
            ]
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team1');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();

        assert.equal(homePoints, 3);
        assert.equal(awayPoints, 1);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();

        assert.equal(homeGames, 12);
        assert.equal(awayGames, 8);
    })

    describe('Test 0:2 finish', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(1, 6),
                new structs.SetScore(5, 7)
            ]
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team2');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();

        assert.equal(homePoints, 1);
        assert.equal(awayPoints, 3);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();

        assert.equal(homeGames, 6);
        assert.equal(awayGames, 13);
    })

    describe('Test 1:2 finish', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(1, 6),
                new structs.SetScore(7, 5),
                new structs.ExtendedTiebreakScore(1, 10)
            ]
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team2');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();

        assert.equal(homePoints, 1);
        assert.equal(awayPoints, 3);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();

        assert.equal(homeGames, 8);
        assert.equal(awayGames, 12);
    })

    describe('Test home in-game forfeit', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(0, 6),
                new structs.SetScore(1, 1)
            ],
            structs.HomeAway.HOME
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team2');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();
        assert.equal(homePoints, 1);
        assert.equal(awayPoints, 3);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();
        assert.equal(homeGames, 1);
        assert.equal(awayGames, 12);
    })

    describe('Test away in-game forfeit', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            [
                new structs.SetScore(0, 6),
                new structs.SetScore(1, 1)
            ],
            structs.HomeAway.AWAY
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team1');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();
        assert.equal(homePoints, 3);
        assert.equal(awayPoints, 1);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();
        assert.equal(homeGames, 7);
        assert.equal(awayGames, 7);
    })

    describe('Test home pre-match forfeit', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            null,
            structs.HomeAway.HOME
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team2');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();
        assert.equal(homePoints, 0);
        assert.equal(awayPoints, 3);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();
        assert.equal(homeGames, 6);
        assert.equal(awayGames, 12);
    })

    describe('Test away pre-match forfeit', function () {
        let match = new structs.FinishedMatch(
            'team1',
            'team2',
            null,
            structs.HomeAway.AWAY
        )

        // winner
        let winner = match.getWinner();
        assert.equal(winner, 'team1');

        // points
        let homePoints = match.getHomePoints();
        let awayPoints = match.getAwayPoints();
        assert.equal(homePoints, 3);
        assert.equal(awayPoints, 0);

        // games
        let homeGames = match.getHomeGames();
        let awayGames = match.getAwayGames();
        assert.equal(homeGames, 12);
        assert.equal(awayGames, 6);
    })
})

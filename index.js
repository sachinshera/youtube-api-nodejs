import dotenv from 'dotenv-flow';
import request from 'request';
import express from 'express';
import queryString from 'query-string';
const app = express();
import ytdl from "ytdl-core";
const API_KEY = process.env.API_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const youtubeManagementSocpe = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtubepartner",
    "https://www.googleapis.com/auth/youtubepartner-channel-audit",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/youtube.channel-memberships.creator",
]

// google auth

app.get('/google', (req, res) => {
    const stringifiedParams = queryString.stringify({
        client_id: CLIENT_ID,
        redirect_uri: 'http://localhost:9000/auth/google/callback',
        scope: youtubeManagementSocpe.join(' '),
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
    });

    const googleLoginUrl = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
    res.redirect(googleLoginUrl);
});

app.get('/auth/google/callback', (req, res) => {
    const code = req.query.code;
    if (code) {
        getGoogleAccessToken(code)
            .then((response) => {
                console.log("login code", response);
                res.send(response);
            })
            .catch((err) => {
                console.log(err);
                res.send(err);
            });
    } else {
        res.send('error');
    }
});



const getGoogleAccessToken = (code) => {
    return new Promise((resolve, reject) => {
        const url = 'https://oauth2.googleapis.com/token';
        const values = {
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_ID,
            redirect_uri: 'http://localhost:9000/auth/google/callback',
            grant_type: 'authorization_code'
        };
        request.post(url, { form: values }, (err, res, body) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve(JSON.parse(body));
        });
    });
};

// get youtube channel list

app.get('/youtube/channel', (req, res) => {
    var response = res;
    const url = 'https://www.googleapis.com/youtube/v3/channels';
    const params = {
        part: 'snippet,contentDetails,statistics',
        mine: true
    };
    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json'
    };
    request.get({ url, qs: params, headers }, (err, res, body) => {
        if (err) {
            console.error(err);
        }
        response.send(JSON.parse(body));
    });
});

// get videos by channel id

app.get('/youtube/videos/:id', (req, res) => {
    let channelId = req.params.id;
    var response = res;
    const url = 'https://www.googleapis.com/youtube/v3/search';
    const params = {
        part: 'snippet',
        channelId: channelId,
        maxResults: 50,
        order: 'date',
        type: 'video'

    }

    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
    }


    request.get({ url, qs: params, headers }, (err, res, body) => {
        if (err) {
            console.error(err);
        }
        response.send(JSON.parse(body));
    })
});

// get video by video id

app.get('/youtube/videoinfo/:id', (req, res) => {
    let videoId = req.params.id;
    var response = res;
    const url = 'https://www.googleapis.com/youtube/v3/videos';
    const params = {
        part: 'snippet,contentDetails,statistics,recordingDetails,status,player',
        id: videoId
    }

    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',

    }

    request.get({ url, qs: params, headers }, (err, res, body) => {
        if (err) {
            console.error(err);
        }
        response.send(JSON.parse(body));
    })
});

// get exact video url by video id

app.get('/youtube/videourl/:id', (req, res) => {
    let videoId = req.params.id;
    var response = res;
    const url = 'https://www.googleapis.com/youtube/v3/videos';
    const params = {
        part: 'snippet,contentDetails,statistics',
        id: videoId,
        fields: 'items(id,snippet(title,thumbnails),contentDetails(duration),statistics(viewCount))',

    }

    const headers = {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
    }

    request.get({ url, qs: params, headers }, (err, res, body) => {
        if (err) {
            console.error(err);
        }
        response.send(JSON.parse(body));
    })
});



app.get('/youtube/download/:id', async (req, res) => {
    let videoId = req.params.id;

    let info = await ytdl.getInfo(videoId);
    console.log(info);

    res.send(info);
});





app.listen(9000, () => {
    console.log("Server is running on port 9000");
});



# PREDIX - INTEGRATION WITH ALEXA VOICE SERVICE

## About
Build by [maxceem](https://www.topcoder.com/members/maxceem/) on topcoder.com  

Challenge Details: https://www.topcoder.com/challenge-details/30058889/?type=develop&noncache=true

## Video

The demo video is available on the YouTube by [this link](https://youtu.be/GY-BMl9keWs) only.

## Compatibility

Project has been developed using Mac OS and has to run smoothly on the Linux type system. Although I don't see any reasons why it wouldn't run on Windows machine.

Client side has been tested in Chrome on Mac OS and Windows, and Edge on Windows.
It doesn't work in Safari on Mac OS at all due to lack of [WebRTC support](http://iswebrtcreadyyet.com/).
Also I didn't managed to accomplish full support in FireFox. It cannot play Alexa responses. I hope it's enough for PoC project. AVS returns voice responses in mp3 format which FireFox supports using system functions. So maybe on another system it could work. Anyway in the future there could be found a way either to accept mp3 files by FireFox, or convert received files to another format by client side for FireFox.

## Config

A config file is placed at the `/config/config.js`. It lacks some values which have to be obtained in the steps below.
Don't directly run commands which I mention in the description in this table. I only put them as a reference here, but they have to be run in context with proper arguments.

|Value                | Description |
|---------------------|-------------|
|`amazon.deviceId`    | Product ID of Alexa Voice Service. You can leave it as it is but don't forget to use it during [Alexa Voice Service setup](#user-content-amazon-voice-service-avs). |
|`amazon.clientId`    | Amazon product Client Id which has to be obtained after creating Security Profile when following [this guide](https://github.com/alexa/alexa-avs-sample-app/wiki/Create-Security-Profile) |
|`amazon.clientSecret`| Amazon product Client Secret which is obtained together with `amazon.clientId`  |
|`predix.apiUrl`      | Predix API endpoint. You get it after performing `px login` command and selecting a location. |
|`predix.uaaUrl`      | Predix UAA Service URI. You get it after performing `px create-service predix-uaa Free your-name-uaa` in [Predix Guide](https://www.predix.io/resources/tutorials/tutorial-details.html?tutorial_id=2396&tag=1719&journey=Hello%20World&resources=1844,2388,2369,2396,1569,1523) section **Create an instance of the User Account and Authentication (UAA) Service** |
|`predix.clientId`    | Id of the client which has access to Predix Asset Service. You define it as an argument `--client-id app_client_id` when performing command `px cs predix-asset Free your-name-asset your-name-uaa --client-id app_client_id` in [Predix Guide](https://www.predix.io/resources/tutorials/tutorial-details.html?tutorial_id=2396&tag=1719&journey=Hello%20World&resources=1844,2388,2369,2396,1569,1523) section **Create a Predix Service** |
|`predix.clientSecret`|  A secret of the client with id `predix.clientId` from the item above. You define during performing command above when you are prompted for `Client Secret>`. |
|`predix.zoneId`      | Predix Zone Id of the created instance of Predix Asset service. You get as an output of the command `px cs predix-asset Free your-name-asset your-name-uaa --client-id app_client_id` in [Predix Guide](https://www.predix.io/resources/tutorials/tutorial-details.html?tutorial_id=2396&tag=1719&journey=Hello%20World&resources=1844,2388,2369,2396,1569,1523) section **Create a Predix Service** |

Manifest file for deploying to Predix Cloud is placed here `/manifest.yml`.

|Value                 | Description |
|----------------------|-------------|
|`applications[0].name`| Unique for Predix application name. It will be a part of your application domain like `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io`. You can just define any, which you want as long as it's unique. |

### Predix UAA and Asset Services

I suppose that you already have a Predix account. Otherwise, you can [register](https://www.predix.io/registration/). Be aware that if you are not white-listed during some Topcoder challenge, your application can be rejected. See [Predix Topcoder Community](http://predix.topcoder.com/) for more information.

Please, complete the next steps from [Predix Guide](https://www.predix.io/resources/tutorials/tutorial-details.html?tutorial_id=2396&tag=1719&journey=Hello%20World&resources=1844,2388,2369,2396,1569,1523).
In the description below I will only tell which configuration values you will get on each step.

- **What you need to set up**

  Make sure you've installed all required tools.

  **It's important to have the latest version 0.6.3 or later of Predix CLI**. You can check a version number by running `px -v` in your console.

  In case of error
  ```
  FAILED
  Error read/writing config:  open /Users/%user%/.cf/config.json: permission denied
  ```
  Romove the `~/.cf` dir first `sudo rm -r ~/.cf` and after run some `px`/`cf` command, for example `px -h`.

- **What you need to do**
  - **Sign in to Predix**

  - **Create an instance of the User Account and Authentication (UAA) Service**

    On this step, you will obtain `uri` for `predix.uaaUrl` value in config, which looks like `https://123a4567-89a0-1abc-123a-1ab2c3d456e7.predix-uaa.run.aws-usw02-pr.ice.predix.io`

  - **Create a Predix Service**

    You will obtain:
    - `predix.apiUrl` you will get ti is an output in `uri` property. It looks like `https://predix-asset.run.aws-usw02-pr.ice.predix.io`.
    - `predix.clientId` is the value you've entered instead of `app_client_id` in the command `px cs predix-asset Free your-name-asset your-name-uaa --client-id app_client_id`
    - `predix.clientSecret` is the secret word which you entered when prompted for `Client Secret>`
    - `predix.zoneId` you obtain as an output of the command above as a property `zone.http-header-value` which looks like `kj1234j4-12k2-4cd3-1233-12k12k22133k`.

#### Verification of Predix Services configuration
After all values like `predix.*` are configured, you can check it locally by running the next commands:
- `npm i` - to install dependencies
- `npm run dev` - run server locally by default on http://localhost:3000. If you open this address in the browser you have to see an error `Error. There are no surveys. Please add some surveys first.`. It means that configuration above is correct. There is just no data.
- `npm run create-surveys` - has to create a test data without errors.
- After that if navigate to http://localhost:3000 during running `npm run dev`, you have to be redirected to http://localhost:3000/?id=1 and see a page with "Login with Amazon" circle button.

## Amazon Voice Service (AVS)

First of all, you will need Amazon developer account. You can create it here https://developer.amazon.com/devices by pressing **Sign In** in the top right corner and after by pressing **Create you Amazon Developer account** in the popup.

Using your development account please, follow this [detailed guide](https://github.com/alexa/alexa-avs-sample-app/wiki/Create-Security-Profile) of how to setup AVS.
You will need to complete all the steps in that guide. In the description below I will only tell which configuration values you will get on each step.

- Product Information
  - The only field is important for us is **Product ID**. You can use the one which is already used in config `amazon.deviceId`. Or define any value you want here, but update config `amazon.deviceId` after.
- Security Profile
  - During creating security profile you will have to add `http://localhost:3000` to **Allowed Origins** and `http://localhost:3000/authresponse` to **Allowed Return URLs**.
  - Also during creating security profile you will get **Client ID** which you have to put to `amazon.clientId` and which looks like `amzn1.application-oa2-client.12h312h34oh124hu2h42h34h234h2i34`. And you will get **Client secret** which has to be put to `amazon.clientSecret` and looks like `l2h34jh23k4h2j3k4hkj23h4jh23k4h23jk4h2kj3h4k23h4l23h4l23h4k2h342`.

#### Verification of Amazon Voice Service configuration

After you've configured all empty values in the config file, you can check how Alexa Voice Service works.
Providing that you've already installed all dependencies by `npm i`, run the following commands:
- `npm run dev` - run server locally
- Go to http://localhost:3000/ in your browser.
- Click **Login with Amazon** button you will be forwarded to the Amazon login form. Enter your Amazon development account credentials and confirm access to your product that you've created before.
- After you will be redirected back to the localhost. As a proof of login you will have to see **Logout** button in the top right corner.
- You have to give access to your microphone. Be aware that browser can block access to microphone even on localhost without having secure connection. If you are facing such issue, please use Chrome. This only applies to running service locally. When running in the cloud we have https connection, so no complains from the browsers.
- Since now you can give commands to Alexa. Though Predix survey skill is not configured at this point yet.
  For test, press & hold **Hold & Speek** button and say `Alexa, how are you?`. And after processing, you will have to get sound respond from Alexa service.

## Deployment to Predix Cloud

Before continue configuring we have to deploy to Predix Cloud to obtain the URL of our service.
Define `applications[0].name` in `/manifest.yml` first. You can use any value as long as it's unique for Predix and can be a part of the domain name.
It will be a part of service url, which will looks like `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io`.

In the project directory run the following commands using console:
- `px login` - login to Predix, if you are not logged in yet
- `git init` - initiate git repository, if project is not in git repository yet
- `git add .` - adds all the changes to the commit
- `git commit -m"initial commit"` - you can change commit message
- `px push` - uploads code to the server, build and run application in the cloud

`px push` will output some info, including your service domain in `urls` option.
Open your service in browser by the link you've got which looks like `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io`. You will see a page with "Login with Amazon" circle button.

Before using Alexa Skill you still have to [configuring Amazon Voice Service](#user-content-add-predix-cloud-urls-to-avs-security-profile) and [Alexa Skill](#user-content-alexa-skill).

## Add Predix Cloud URLs to AVS Security profile

Now as you have your deployed service URL, you have to add it to AVS Security profile.

- Open [list of your Alexa products](https://developer.amazon.com/avs/home.html#/avs/home).
- In front of the product you've created, click **Manage** button.
- In the left side menu choose **Security Profile**.
- Add domain provided by the Predix cloud. Something like `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io` to **Allowed Origins** and `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io/authresponse` to **Allowed Return URLs**.

#### Verification of Amazon Voice Service configuration for Predix Cloud

Try to login with Amazon using service deployed to the cloud. Also, you can start making commands to Alexa, but Predix Survey Skill is not available yet.

## Alexa Skill

Now we have to configure Predix Survey Alexa Skill.

- Go to [Amazon Developer Portal, section Alexa](https://developer.amazon.com/edw/home.html#/)
- Click **Get Started** button on **Alexa Skill Kit** card
- Click **Add a New Skill** on the right top corner and then fill options like described below
- **Skill Information**:
  - **Skill Type**: `Custom Interaction Model`
  - **Language**: `English (U. S.)` - **Important!**
  - **Name**: Skill name, for example `Predix Survey`
  - **Invocation Name**: words to tell to run skill, put `predix survey` for our skill.
- **Interaction Model**
  - **Intent Schema**. Insert code from file `/data/skill/intent-schema.json`.
  - **Sample Utterances**. Insert code from file `/data/skill/sample-utterances.txt`.
  - after you click save, wait until the model is successfully updated
- **Configuration**
  - **Service Endpoint Type**, choose `https`
  - **Default**, paste deployed service url with `/surveys` endpoint. It should look somethink like `https://${applications[0].name}.run.aws-usw02-pr.ice.predix.io/surveys`
- **SSL Certificate**
  - **Certificate for DEFAULT Endpoint**, choose `My development endpoint is a sub-domain of a domain that has a wildcard certificate from a certificate authority`.

### Verification of Alexa Skill configuration

At this point, we completely finished configuration and deployment process.

You can open project locally or deployed to the cloud. Log in with your development Amazon account which was used to create Alexa Skill, press **Hold & Speek** button and say `start Predix Survey`. After some processing, you will have to hear respond like `Let start survey with the title...`.

## Commands

Before running commands, you have to configure some services, see section [Config](#user-content-config).

| Command                    | Description |
|----------------------------|-------------|
| `npm run dev`              | starts server for development (watch changes with nodemon for server side and with webpack for client side) |
| `npm start`                | starts server for production (serves client side from /dist directory) |
| `npm run create-surveys`   | populate Predix Asset Service with demo surveys from `/data/surveys.json` |
| `npm run view-responses`   | show saved to Predix Asset Service responses, for test purposes |
| `npm run clear-responses`  | remove saved to Predix Asset Service responses, for test purposes |
| `npm run build`            | builds client side to /dist directory for production, it's invoked in postinstall process |
| `npm run build:dev`        | builds client side to /dist directory for development |
| `npm run lint`             | lint all js code with eslint |
| `npm run lint:fix`         | lint all js code with eslint and fix errors which could be fixed automatically |

## Run locally

You can run project locally in development mode by command `npm run dev`. Make sure that port 3000 is available, or if you run on another port you have to add URL with such port to [AVS Security Profile](#user-content-add-predix-cloud-urls-to-avs-security-profile).

Or you can run in production mode by two commands `npm run build` to build frontend to `/dist` directory and `npm start` to serve service for production.

Be aware, that Alexa Skill uses provided endpoint at Predix Cloud, so you have to deploy to the cloud first. And functions related to `/src/server/alexa-skill.js` will be served from the cloud even when run locally.

Also, local project uses the same Predix Asset as deployed to the cloud. So when you create surveys or give responses to surveys these changes are reflected in both environments.

## Implementation notes

- Using Alexa Skill for our task, bring us some additional features. Instead of dummy speech-to-text conversion, she always tries to understand our intent when we say something. Thus during survey we can ask her `what is the weather`, `how are you` or `what time is it now` and she will react instead of treating it like an answer. So it's like having a survey with a real person. As a drawback, sometimes when we just want to answer the question, Alexa can understand that we want something from her, and she will perform the action, instead of writing down our answer for the survey. For such situations there are two ways to come back to survey:
  - Tell Alexa: `ask Predix Survey to continue` - and it has to continue survey from the last unanswered question.
  - Tell Alexa: `tell Predix Survey that [your answer]` - and it will write down `[your answer]` as an answer to your last question and continue the survey.
- To make Alexa Skill accept arbitrary survey answers [AMAZON.LETRAL](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interaction-model-reference#literal) slot type has been used. Though we have to be aware, that previously they were going to remove this type, but leave it because a lot of people asked. Now it's available only for *English (U. S.)* and is not available for two other Alexa languages.
- There is no easy direct way to pass *survey id* and *user name* from the frontend to Alexa Skill. The thing is, that we don't know which user on the frontend corresponds to which user of Alexa Skill. There is no way just to send additional information with the request from the frontend to Alexa Skill. There are few solutions.

  - The first approach that could be used, is to pass this data to Alexa Skill by voice. But as we use `AMAZON.LITERAL` slot type to parse the whole answer, it's very hard to combine it with another slot types. As this slot type without any prefix just suits to anything we say and thus can get all our words no matter what our intent is. We either have to restrict answer options to limited predefined set and don't use literal slot type or introduce some prefixes to our answers. So Alexa can understand our intent. As getting arbitrary answers was a desired feature, I decided not stick to this approach.

  - The second approach let us match frontend users and Alexa Skills users. To accomplish this we have to set up or own OAuth 2.0 service, where user has to have his account. User has to connect his account in our system to his Alexa account. After that, with Alexa Skill requests, we will get user token, which we can use to obtain data about user. There is a [documentation from Amazon](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/linking-an-alexa-user-with-a-user-in-your-system).

    Using this approach not only will make already intricate configuration process as *mission impossible*, but also will make this challenge even longer as I will need more time for this.

  - I used this one 'hacky' solution as I think it's enough for proof of concept project.

    Seeing that I host frontend and Alexa Skill using same node application I can take current *survey id* and *user name* from the user session and put them to a singleton kind object. And use that object to obtain user data in Alexa Skill. As a drawback, all the users interact with the system with same data.

    This hack is just a matter of a few lines, and the rest of the code is totally ready to work with real user sessions. So it's ready to implement using the second approach, which is the best but complicated.

## Verification

After configuration is finished and service is deployed to the cloud we can run service locally to have easy access to server console output which could be useful during testing.

- `npm run lint` - check that code pass the linting first. I use Airbnb rules as required with few exceptions.
- `npm run data` - make sure to populate demo surveys. You can check their code in the file `/data/surveys.json`.
- `npm run dev` - run server locally and open http://localhost:3000.
- Press **Login with Amazon** button and use your Amazon development account credentials, same which were used to create Alexa Skill.
- After you came back, make sure that you let service to access your microphone. You can start survey by press and hold button **Hold & Speek** and saying `start Predix Survey`.
- Listen to the questions and make your answers short on the one breath.
- When the survey is finished you can check your responses by running `npm run view`.

## Additional features

I've implemented an easy way to create surveys in Predix Asset Service together with the easy way to check saved responses. It was directly pointed that it suppose to be treated as additional feature https://apps.topcoder.com/forums/?module=Thread&threadID=905179#2211787.

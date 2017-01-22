# filter-component [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> elastic.io filter component to filter incoming data based on arbitrary expression

# filter-component
Filter component for the [elastic.io platform](http://www.elastic.io &#34;elastic.io platform&#34;)

If you plan to **deploy it into [elastic.io platform](http://www.elastic.io &#34;elastic.io platform&#34;) you must follow sets of instructions to succseed**. 

## Before you Begin

Before you can deploy any code into elastic.io **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how. 

We&#39;ll use git and SSH public key authentication to upload your component code, therefore you must **[upload your SSH Key](http://docs.elastic.io/docs/ssh-key)**. 

&gt; If you fail to upload you SSH Key you will get **permission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://docs.elastic.io/docs/teams) to work on your new component. This is not required but will be automatically created using random naming by our system so we suggest you name your team accordingly.
* [Create a repository](http://docs.elastic.io/docs/component-repositories) where your new component is going to *reside* inside the team that you have just created.

Now as you have a team name and component repository name you can add a new git remote where code shall be pushed to. It is usually displayed on the empty repository page:

```bash
$ git remote add elasticio your-team@git.elastic.io:your-repository.git
```

Obviously the naming of your team and repository is entirely upto you and if you do not put any corresponding naming our system will auto generate it for you but the naming might not entirely correspond to your project requirements.
Now we are ready to push it:

```bash
$ git push elasticio master
```

## Authentication

Authentication is happening via OAuth2.0. In order to make OAuth work you need a new App in your XXX. 
During app creation process you will be asked to specify
the callback URL, to process OAuth auehtncation via elastic.io platform your callback URL should be 

```
https://your-tenant.elastic.io/callback/oauth2
```

If you are testing it on default public tenant just use ``https://app.elastic.io/callback/oauth2``


## Configure OAuth Client key/secret

In the component repository you need to specify OAuth Client credentials as environment variables. You would need two variables

 * ```XXX_KEY``` - your OAuth client key
 * ```XXX_SECRET``` - your OAUth client secret
 
## Known limitations

* Reject task should be:
 * Created by the same user
 * Start with elastic.io standard WebHook
* Be carefull when changing the type of the rejected task flow (ordinary/long-running) and make sure you restart the task with the filter


## License

Apache-2.0 © [elastic.io GmbH](https://www.elastic.io)


[npm-image]: https://badge.fury.io/js/filter-component.svg
[npm-url]: https://npmjs.org/package/filter-component
[travis-image]: https://travis-ci.org/elasticio/filter-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/filter-component
[daviddm-image]: https://david-dm.org/elasticio/filter-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/filter-component

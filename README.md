# MoveFast Backend Technical Test

Hi there, this is a brief description and/or explanation of my solution to the technical test.

## Commands

To run the server, please use

```
npm start
```

To test the server, please use

```
npm test
```

## Notes

### Time

Since the problem states that the time format will be `yyyy-mm-ddThh:mm:ssZ`, all datetime data will be treated as UTC.
This means that all endpoints will accept and return datetime data in UTC format. It is, then, up to the client caller
to call the endpoints with the correct datetime format.

### The redeem reward endpoint

According to the problem statement:

> After calling the GET request above, I should then be able to request
> `PATCH /users/1/rewards/2020-03-18T00:00:00Z/redeem` (to simplify things we're using availableAt as the reward ID)

My solution is a bit more robust since it can also handle _**any time frame within the current date itself**_. For
example, both

```
/users/1/rewards/<today>T00:00:00Z/redeem
```

and

```
/users/1/rewards/<today>T12:12:12Z/redeem
```

will work given that `<today>` marks the current date.

This is actually a side effect of having each reward cached by its week start date. So any datetime whose time is
within the current date will work.

## Design decisions

Since this is stated as a simple API server, it has impacts on how the solution came to be:

- [Libraries](#libraries) can be minimised instead of full-blown web frameworks, and
- [Project](#project-structure) and [application structure](#application-structure) can be simplified, and
- [What kind of testing has been done](#testing).

### Libraries

The project includes a number of libraries, only `express` is essential, the rest are development-related to ensure
code quality:

- `express`: Server framework
- `nodemon`: Node monitor for running express
- `typescript` and friends: JavaScript with types
- `jest`: unit testing framework
- `supertest`: API testing framework
- `eslint`: code linting
- `prettier`: Code reformatting

### Project structure

There are a couple of ways to structure this project. For example, having `src` and `test` separated to indicate source
and test directories. Another way is to have test files with source files but appended with `.spec` or `.test`
extension, which is what I've chosen to use.

Thus, there are 2 test files: `app.spec.ts` and `dateService.spec.ts` to test `app.ts` and `dateService.ts`
respectively.

### Application structure

In `src` directory, there are a couple of files:

- `main.ts`: Main file that starts up the express server
- `app.ts`: Setting up the two endpoints for the server
- `app.spec.ts`: Test file for `app.ts`
- `dateService.ts`: Service file to handle the generation and reward redeeming functionality
- `dateService.spec.ts`: Test file for `dateService.ts`
- `types.d.ts`: Store a couple of useful types and interfaces used across the app

#### Separate main.ts from app.ts

I've chosen to separate the endpoint definitions (controllers) from the server start-up because:

1. It's best practice to have separate controllers, each handling its own stuff
2. Better testing because you can just test the controllers without starting up the entire server

Here instead of having separate controller files for each endpoint like any framework would (Spring, NestJS, etc.),
I'm just grouping both of them into a single file `app.ts` for simplicity.

#### Separate service from controller

I've chosen to separate the core functionality (generating weekly rewards and redeeming rewards) from the controllers
because:

1. It's best practice to separate controllers from services and repositories (DAOs)
2. It makes it easy to test out the functionality of the services in isolation

Typically full-blown prod-ready application will have separate service objects that are tied to the lifecycle of the
application. Obviously that's a bit too overkill for this so here the controllers just call the service functions
directly.

### Testing

Here I've done unit and integration testing. For a production application, more testing is needed:

- System testing: run the application in a process and have a separate process sending requests to test for responses
- Load testing: run the application in a process and hit it with an increasing amount of requests to see how it behaves
  over time
- Stress testing: like load testing but go over its limit to see how it gracefully degrades over time
- End-to-end testing: Boot up a frontend with backend and run Cucumber tests against it

# The end

That's all. Should this document not be sufficient, I'll be happy to answer any question you may have. Thank you
for reading :)

# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["screenshot of Signin Page"](https://github.com/Wwong154/tiny-app/blob/master/doc/demo_Signin.png)
!["screenshot of urls Page"](https://github.com/Wwong154/tiny-app/blob/master/doc/demo_urls.png)
!["screenshot of urls/:id Page"](https://github.com/Wwong154/tiny-app/blob/master/doc/demo_urls_:id.png)
!["screenshot of urls/new Page"](https://github.com/Wwong154/tiny-app/blob/master/doc/demo_urls_new_.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- method-override

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.

## Usage

- Tinyapp will allow registered user to create shorten url
- Tinyapp will store you list of url, and only owner will be able to edit/ delete
- Owner will be able to see the total visit and unique visit of the url that they have created
- Guest or non-owner will not be allow to see the destination of the url, though still able to get redirected
- Please note this project is for learning purposes only.
- Thank you for taking your time to read til the end, have a nice day.

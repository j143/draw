var conf=null;
if (window.location.hostname === "localhost") {
    conf = {
        githubClientId: "4ec60d86b7e1eef385b3",
        githubAuthenticateCallback: "https://localhost/~andherz/githubCallback.php?code=",

    };
}
else{
    conf = {
        githubClientId: "20a3f1473dd7d17fcbcf",
        githubAuthenticateCallback: "https://draw2d.herokuapp.com/authenticate/"
    };
}

conf.fileSuffix = ".shape";
conf.repository="https://raw.githubusercontent.com/freegroup/draw2d_js.shapes/master/shapes/org/";
var conf=null;
if (window.location.hostname === "localhost") {
    conf = {
        githubClientId: "80b7ed215a5ec8471ff4",
        githubAuthenticateCallback: "http://localhost/~andherz/githubCallback.php?code="
    };
}
else{
    conf = {
        githubClientId: "20a3f1473dd7d17fcbcf",
        ithubAuthenticateCallback: "https://draw2d.herokuapp.com/authenticate/"
    };
}

var conf=null;
if (window.location.hostname === "localhost") {
    conf = {
        githubClientId: "4ec60d86b7e1eef385b3",
        githubAuthenticateCallback: "http://localhost/~andherz/githubCallback.php?app=designer&code=",

    };
}
else{
    conf = {
        githubClientId: "20a3f1473dd7d17fcbcf",
        githubAuthenticateCallback: "http://www.draw2d.org/githubCallback.php?app=designer&code="
    };
}

conf.fileSuffix = ".shape";
conf.repository="https://raw.githubusercontent.com/freegroup/draw2d_js.shapes/master/shapes/org/";
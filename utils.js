import fs from "fs";
import child_process from "child_process";
import {GIT_REPOSITORY_PATH_PREFIX} from "./config";
const promisify = fn => function(){
	return new Promise((resolve, reject) => {
		fn(...arguments, (err, ...rest) => {
			err && reject(err);
			resolve(...rest);
		});
	});
};
const compileCSV = fn => (id, file) => {
	let t = file.split("\n");
	t.shift();
	return t.reduce((table, row) => {
		return table.concat(fn(id, row));
	}, []).join("");
};
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const exec = promisify(child_process.exec);
export const compileCSVToNginxConfig = compileCSV((id, str) => {
	const conf = str.split(","),
		project = conf[3].split("/")[1],
		port = conf[4];
	return `#-------------------${conf[0]}-------------------
server {
	listen 80;
	server_name ${project}.${conf[1]}.${conf[2]}.com;
	location / {
${[
`		proxy_pass 127.0.0.1:${conf[4]};`,
`		root ${GIT_REPOSITORY_PATH_PREFIX}${id}/${conf[1]}/${project};
		index index.html;
		error_page 404 /;`
][+!port]}
	}
}\n`;
});
export const compileCSVToStaticGitShell = compileCSV((id, str) => {
	const conf = str.split(",");
	return `\ncd ${GIT_REPOSITORY_PATH_PREFIX}${id}
mkdir ${conf[1]}
cd ${conf[1]}
a=$(git clone https://github.com/${conf[3]}.git)
echo $a`;
});
export const compileCSVToNodeGitShell = compileCSV((id, str) => {
	const conf = str.split(",");
	return `\ncd ${GIT_REPOSITORY_PATH_PREFIX}${id}
mkdir ${conf[1]}
cd ${conf[1]}
a=$(git clone https://www.github.com/${conf[3]}.git)
echo $a
cd ${conf[3].split("/")[1]}
a=$(npm install --production)
echo $a`;
});
export const getHTML = async (time, area) => {
	return (await readFile("./static/modifier.html", "utf-8")).replace(/(\/upload)/, "$1" + `?id=${time}.${area}`);
};
import * as fse from "fs-extra";
import * as yaml from "js-yaml";
import * as path from "path";
import * as semver from "semver";
import {Logger} from "./Logger";

const businessAreas: string[] = fse.readJSONSync("./src/ApiByBusinessArea.json");
let swagger: any;
let newSwagger: any;
const calculations = "/calculations";
let updateVersion: boolean = false;

export function updatePaths(pathToFiles: string, updateFlag?: boolean) {
  if (updateFlag) {
    updateVersion = updateFlag;
  }
  readFiles(pathToFiles);
}

function readFiles(pathToFiles: string) {
  fse.readdir(pathToFiles, (err, files) => {
    if (err) {
      Logger.error("Could not find the directory." + err);
      process.exit(1);
    }
    files.forEach((file) => {
      // skip node_modules
      if (file === "node_modules") {
        return;
      }
      // make the path to file complete
      file = path.resolve(pathToFiles, file);
      // check statistics about a path and if it is a file, proceed with processing
      fse.stat(file, (error, stat) => {
        const extension: string = path.extname(file);
        const fileName: string = path.basename(file, extension);
        const fileNameWithExtension = fileName.concat(extension);
        // only go further if file is a .yaml or swagger.json
        if (stat && stat.isFile() && (fileNameWithExtension.match(/([a-zA-Z0-9\s_\\-])+(\.yaml)$/i)
        || fileNameWithExtension === "swagger.json")) {
          swagger = loadData(file, extension);
          newSwagger = processSwagger();
          saveNewData(newSwagger, file, extension);
          Logger.success("Paths successfully updated in ", fileName);
        } else if (
        // if update flag is true update minor version in packages
        stat && stat.isFile() && (fileNameWithExtension === "package-lock.json"
        || fileNameWithExtension === "package.json") && updateVersion) {
          updatePackageVersion(file, extension);
        } else if (stat && stat.isDirectory()) {
          // if address is a directory go deeper
          readFiles(file);
        }
      });
    });
  });
}

function loadData(pathToFile: string, extension: string): string {
  if (extension === ".yaml") {
    return yaml.safeLoad(fse.readFileSync(pathToFile, "utf-8"));
  } else {
    return fse.readJSONSync(pathToFile);
  }
}

function saveNewData(newData: string, fileName: string, extension: string) {
  if (extension === ".yaml") {
    fse.writeFileSync(fileName, yaml.safeDump(newData, {noRefs: true}));
  } else {
    fse.writeJSONSync(fileName, newData, {spaces: 2});
  }
}

function processSwagger(): any {
  let copySwagger = deepCopy(swagger);
  if (updateVersion) {
    copySwagger = updateInfoVersion(copySwagger);
  }
  if (copySwagger.host) {
    copySwagger.host = changeHost(copySwagger.host);
  }
  if (copySwagger.basePath) {
    copySwagger.basePath = newPath(copySwagger.paths, copySwagger, copySwagger.basePath);
  }
  return copySwagger;
}

function changeHost(host: string) {
  const splitHost = host.split(".");
  splitHost[0] = "api";
  return splitHost.join(".");
}

function newPath(paths: string[], copySwagger: any, basePath: string): string {
  const firstPath = Object.keys(paths).shift();
  const businessArea = findBusinessArea(firstPath, copySwagger, basePath);
  Object.keys(paths).forEach((p) => {
    createNewPath(p, copySwagger, businessArea);
  });
  return "/";
}

function findBusinessArea(p: string, copySwagger: any, basePath: string): string {
  const pathToMatch = manipulatePath(p);
  Object.keys(businessAreas).forEach((key) => {
    businessAreas[key].forEach((element) => {
      if (pathToMatch === element || pathToMatch.includes(element)) {
        basePath = key;
      }
    });
  });
  chackForExtraChanges(pathToMatch, copySwagger);
  return basePath;
}

function manipulatePath(firstPath: string): string {
  const splitPath = firstPath.split("/");
  const pathToMatch: string[] = [];
  splitPath.forEach((part) => {
    if (part.match(/\b[^\d\W]+\b/)) {
      pathToMatch.push(part);
    }
  });
  return pathToMatch.join("/");
}

function chackForExtraChanges(pathToMatch: string, copySwagger: any) {
  if (pathToMatch === "lifeExpectancies" || pathToMatch === "transactionDates") {
    Object.keys(copySwagger.paths).forEach((key) => {
      copySwagger.paths[calculations + key] = deepCopy(copySwagger.paths[key]);
      delete copySwagger.paths[key];
    });
  }
}

function createNewPath(p: string, copySwagger: any, businessArea: string) {
  copySwagger.paths[businessArea + p] = copySwagger.paths[p];
  delete copySwagger.paths[p];
}

function updateInfoVersion(copySwagger: any) {
  const regEx = /[a-zA-Z]/;
  if (copySwagger.info.version) {
    copySwagger.info.version = copySwagger.info.version.replace(regEx, "");
    const versionNumber = copySwagger.info.version.split(".");
    if (versionNumber.length <= 1) {
      versionNumber.push(0);
    }
    if (versionNumber.length > 2) {
      versionNumber.pop();
    }

    versionNumber[1] = (parseInt(versionNumber[1], 10) + 1).toString();

    copySwagger.info.version = versionNumber.join(".");
  }
  return copySwagger;
}

function updatePackageVersion(file: string, extension: string) {
  const fileContent: any = loadData(file, extension);
  if (fileContent.version) {
    const parsedVersion = semver.parse(fileContent.version);

    if (parsedVersion.prerelease.length > 0) {
      fileContent.version = semver.inc(semver.inc(fileContent.version, "minor"), "minor");
    } else {
      fileContent.version = semver.inc(fileContent.version, "minor");
    }
    saveNewData(fileContent, file, extension);
  }
}

export const deepCopy = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[];
    (target as any[]).forEach((v) => {
      cp.push(v);
    });
    return cp.map((n: any) => deepCopy<any>(n)) as any;
  }
  if (typeof target === "object" && target !== {}) {
    const cp = { ...(target as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(cp).forEach((k) => {
      cp[k] = deepCopy<any>(cp[k]);
    });
    return cp as T;
  }
  return target;
};
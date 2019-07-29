import * as program from "commander";
import * as fse from "fs-extra";
import { Logger } from "./Logger";
import { updatePaths } from "./updatePaths";

export function start(args: string[]) {

    program.description("Updates swagger with new ref data objects instead of key")
        .option("-d --data <data>", "Yaml swagger file")
        .option("-u --updateVersionFlag", "Optional flag to update PATCH version");

    program.parse(args);
    const NO_COMMAND_SPECIFIED = (!program.data);

    if (NO_COMMAND_SPECIFIED) {
        program.help();
    }
    if (!fse.existsSync(program.data)) {
        Logger.warn("Incorrect directory: " + program.data);
        return;
    }
    updatePaths(program.data, program.updateVersionFlag);
}
import * as glob from "glob";
import * as path from "path";
import * as fs from "fs";
import { minimatch } from "minimatch";
import {
  AnsibleFileTypes,
  PlaybookKeywords,
  StandardRolePaths,
} from "../../definitions/constants";

import { IAnsibleFileType } from "../../interfaces/lightspeed";
import { parseYamlFile } from "./data";

export function getAnsibleFileType(
  filePath: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsedAnsibleDocument?: any
): IAnsibleFileType {
  if (!parsedAnsibleDocument) {
    parsedAnsibleDocument = parseYamlFile(filePath);
  }
  const lastObject = parsedAnsibleDocument[parsedAnsibleDocument.length - 1];
  if (typeof lastObject !== "object") {
    return "other";
  }
  const objectKeys = Object.keys(lastObject);
  for (const keyword of objectKeys) {
    if (keyword in PlaybookKeywords) {
      return "playbook";
    }
  }
  for (const pattern in AnsibleFileTypes) {
    if (AnsibleFileTypes.hasOwnProperty(pattern)) {
      if (minimatch(filePath, pattern as string)) {
        return AnsibleFileTypes[pattern];
      }
    }
  }

  return "other";
}

export function getCustomRolePaths(workspacePath?: string): string[] {
  const rolePaths: string[] = [];

  if (workspacePath) {
    const pattern = path.join(workspacePath, "**/roles");
    const options = {
      ignore: ["**/node_modules/**", "**/.git/**"],
      absolute: true,
    };
    const workspaceRolePaths = glob.sync(pattern, options);
    rolePaths.push(...workspaceRolePaths);
  }

  return rolePaths;
}

export function getCommonRoles(): string[] {
  const rolePaths: string[] = [];
  const expandedPaths = StandardRolePaths.map((p) =>
    path.join(path.parse(p).root, path.normalize(p).slice(1))
  );
  const standardRolePaths = expandedPaths.filter(
    (p) => fs.existsSync(p) && fs.statSync(p).isDirectory()
  );
  rolePaths.push(...standardRolePaths);

  return rolePaths;
}

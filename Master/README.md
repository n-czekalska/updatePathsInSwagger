
## Table of contents

1. [Introduction]
2. [InstallPackages]
3. [Build]
4. [Usage]
5. [Examples]

## Introduction 
This utility contains a command line interface used to update swagger files with a new path based on business area. This utility will look through the given directory in a search of a swagger file and update it's paths.  If flag for version update is provided it will upgrade minor version in swagger and package by 1. If swagger uses patch version it will be removed to keep it consistent across all the swaggers

##Install Packages

In a command window, cd to the project folder where the package.json is located.
Run npm run install.
You should now be able to build and run the application.


##Build

Run npm run build to build the project. 

## Usage
If this is the first time using this utility use command: run npm link.
To start the app use npm run start and then command below in the new terminal:
Usage: updatePaths [options]
Options: 
-d --data <data>   Location of the swagger file/files
-u --updateVersionFlag   Optional flag to update minor version, if provided update is set to true

##Examples

The usage of the utility requires providing a location to a directory containing yaml/json files that have to be updated and optional "-u" if the version should be updated
e.g. updatePaths -d C:\examplePath\Master -u

A path to a file is not accepted.



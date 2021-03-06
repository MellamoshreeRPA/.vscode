# Warning: Don't edit file (autogenerated from python -m dev codegen).

ROBOCORP_GET_LANGUAGE_SERVER_PYTHON = "robocorp.getLanguageServerPython"  # Get a python executable suitable to start the language server
ROBOCORP_GET_LANGUAGE_SERVER_PYTHON_INFO = "robocorp.getLanguageServerPythonInfo"  # Get info suitable to start the language server {pythonExe, environ}
ROBOCORP_GET_PLUGINS_DIR = "robocorp.getPluginsDir"  # Get the directory for plugins
ROBOCORP_CREATE_ROBOT = "robocorp.createRobot"  # Create Robot
ROBOCORP_LIST_ROBOT_TEMPLATES_INTERNAL = "robocorp.listRobotTemplates.internal"  # Provides a list with the available robot templates
ROBOCORP_CREATE_ROBOT_INTERNAL = "robocorp.createRobot.internal"  # Actually calls rcc to create the robot
ROBOCORP_UPLOAD_ROBOT_TO_CLOUD = "robocorp.uploadRobotToCloud"  # Upload Robot to the Robocorp Cloud
ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL = "robocorp.localListRobots.internal"  # Lists the activities currently available in the workspace
ROBOCORP_IS_LOGIN_NEEDED_INTERNAL = "robocorp.isLoginNeeded.internal"  # Checks if the user is already linked to an account
ROBOCORP_GET_LINKED_ACCOUNT_INFO_INTERNAL = "robocorp.getLinkedAccountInfo.internal"  # Provides information related to the current linked account
ROBOCORP_CLOUD_LOGIN = "robocorp.cloudLogin"  # Link to Robocorp Cloud
ROBOCORP_CLOUD_LOGIN_INTERNAL = "robocorp.cloudLogin.internal"  # Link to Robocorp Cloud (receives credentials)
ROBOCORP_CLOUD_LIST_WORKSPACES_INTERNAL = "robocorp.cloudListWorkspaces.internal"  # Lists the workspaces available for the user (in the Robocorp Cloud)
ROBOCORP_UPLOAD_TO_NEW_ROBOT_INTERNAL = "robocorp.uploadToNewRobot.internal"  # Uploads a Robot as a new Robot in the Robocorp Cloud
ROBOCORP_UPLOAD_TO_EXISTING_ROBOT_INTERNAL = "robocorp.uploadToExistingRobot.internal"  # Uploads a Robot as an existing Robot in the Robocorp Cloud
ROBOCORP_RUN_IN_RCC_INTERNAL = "robocorp.runInRcc.internal"  # Runs a custom command in RCC
ROBOCORP_RUN_ROBOT_RCC = "robocorp.runRobotRcc"  # Run Robot
ROBOCORP_DEBUG_ROBOT_RCC = "robocorp.debugRobotRcc"  # Debug Robot
ROBOCORP_ROBOTS_VIEW_TASK_RUN = "robocorp.robotsViewTaskRun"  # Launch selected Task in Robots view
ROBOCORP_ROBOTS_VIEW_TASK_DEBUG = "robocorp.robotsViewTaskDebug"  # Debug selected Task in Robots view
ROBOCORP_SAVE_IN_DISK_LRU = "robocorp.saveInDiskLRU"  # Saves some data in an LRU in the disk
ROBOCORP_LOAD_FROM_DISK_LRU = "robocorp.loadFromDiskLRU"  # Loads some LRU data from the disk
ROBOCORP_COMPUTE_ROBOT_LAUNCH_FROM_ROBOCORP_CODE_LAUNCH = "robocorp.computeRobotLaunchFromRobocorpCodeLaunch"  # Computes a robot launch debug configuration based on the robocorp code launch debug configuration
ROBOCORP_SET_PYTHON_INTERPRETER = "robocorp.setPythonInterpreter"  # Set pythonPath based on robot.yaml
ROBOCORP_RESOLVE_INTERPRETER = "robocorp.resolveInterpreter"  # Resolves the interpreter to be used given a path
ROBOCORP_CLOUD_LOGOUT = "robocorp.cloudLogout"  # Unlink and remove credentials from Robocorp Cloud
ROBOCORP_CLOUD_LOGOUT_INTERNAL = "robocorp.cloudLogout.internal"  # Unlink and remove credentials from Robocorp Cloud internal
ROBOCORP_REFRESH_ROBOTS_VIEW = "robocorp.refreshRobotsView"  # Refresh Robots view
ROBOCORP_REFRESH_ROBOT_CONTENT_VIEW = "robocorp.refreshRobotContentView"  # Refresh Robot Content view
ROBOCORP_NEW_FILE_IN_ROBOT_CONTENT_VIEW = "robocorp.newFileInRobotContentView"  # New File
ROBOCORP_NEW_FOLDER_IN_ROBOT_CONTENT_VIEW = "robocorp.newFolderInRobotContentView"  # New Folder
ROBOCORP_DELETE_RESOURCE_IN_ROBOT_CONTENT_VIEW = "robocorp.deleteResourceInRobotContentView"  # Delete
ROBOCORP_RENAME_RESOURCE_IN_ROBOT_CONTENT_VIEW = "robocorp.renameResourceInRobotContentView"  # Rename
ROBOCORP_REFRESH_CLOUD_VIEW = "robocorp.refreshCloudView"  # Refresh Cloud view
ROBOCORP_START_BROWSER_LOCATOR = "robocorp.startBrowserLocator"  # Start browser to create Locators
ROBOCORP_START_BROWSER_LOCATOR_INTERNAL = "robocorp.startBrowserLocator.internal"  # Start browser to create Locators. Requires the robot where the locators should be saved
ROBOCORP_CREATE_LOCATOR_FROM_BROWSER_PICK = "robocorp.createLocatorFromBrowserPick"  # Create Locator from browser pick
ROBOCORP_CREATE_LOCATOR_FROM_SCREEN_REGION = "robocorp.createLocatorFromScreenRegion"  # Create Image Locator from screen region
ROBOCORP_CREATE_LOCATOR_FROM_SCREEN_REGION_INTERNAL = "robocorp.createLocatorFromScreenRegion.internal"  # Create Image Locator from screen region (internal)
ROBOCORP_CREATE_LOCATOR_FROM_BROWSER_PICK_INTERNAL = "robocorp.createLocatorFromBrowserPick.internal"  # Create Locator from browser pick (internal: provides no UI in case of errors)
ROBOCORP_STOP_BROWSER_LOCATOR = "robocorp.stopBrowserLocator"  # Stop browser used to create Locators
ROBOCORP_GET_LOCATORS_JSON_INFO = "robocorp.getLocatorsJsonInfo"  # Obtain information from the locators.json given a robot.yaml
ROBOCORP_NEW_LOCATOR_UI = "robocorp.newLocatorUI"  # Create locator
ROBOCORP_NEW_LOCATOR_UI_TREE_INTERNAL = "robocorp.newLocatorUI.tree.internal"  # New locator
ROBOCORP_COPY_LOCATOR_TO_CLIPBOARD_INTERNAL = "robocorp.copyLocatorToClipboard.internal"  # Copy locator name to clipboard
ROBOCORP_OPEN_ROBOT_TREE_SELECTION = "robocorp.openRobotTreeSelection"  # Open robot.yaml
ROBOCORP_CLOUD_UPLOAD_ROBOT_TREE_SELECTION = "robocorp.cloudUploadRobotTreeSelection"  # Upload Robot to Robocorp Cloud
ROBOCORP_OPEN_LOCATOR_TREE_SELECTION = "robocorp.openLocatorTreeSelection"  # Open locators.json
ROBOCORP_CREATE_RCC_TERMINAL_TREE_SELECTION = "robocorp.rccTerminalCreateRobotTreeSelection"  # Open terminal with Robot environment
ROBOCORP_SEND_METRIC = "robocorp.sendMetric"  # Send metric
ROBOCORP_SUBMIT_ISSUE_INTERNAL = "robocorp.submitIssue.internal"  # Submit issue (internal)
ROBOCORP_SUBMIT_ISSUE = "robocorp.submitIssue"  # Submit issue
ROBOCORP_CONFIGURATION_DIAGNOSTICS_INTERNAL = "robocorp.configuration.diagnostics.internal"  # Robot Configuration Diagnostics (internal)
ROBOCORP_CONFIGURATION_DIAGNOSTICS = "robocorp.configuration.diagnostics"  # Robot Configuration Diagnostics
ROBOCORP_RCC_TERMINAL_NEW = "robocorp.rccTerminalNew"  # Terminal with Robot environment

ALL_SERVER_COMMANDS = [
    ROBOCORP_GET_PLUGINS_DIR,
    ROBOCORP_LIST_ROBOT_TEMPLATES_INTERNAL,
    ROBOCORP_CREATE_ROBOT_INTERNAL,
    ROBOCORP_LOCAL_LIST_ROBOTS_INTERNAL,
    ROBOCORP_IS_LOGIN_NEEDED_INTERNAL,
    ROBOCORP_GET_LINKED_ACCOUNT_INFO_INTERNAL,
    ROBOCORP_CLOUD_LOGIN_INTERNAL,
    ROBOCORP_CLOUD_LIST_WORKSPACES_INTERNAL,
    ROBOCORP_UPLOAD_TO_NEW_ROBOT_INTERNAL,
    ROBOCORP_UPLOAD_TO_EXISTING_ROBOT_INTERNAL,
    ROBOCORP_RUN_IN_RCC_INTERNAL,
    ROBOCORP_SAVE_IN_DISK_LRU,
    ROBOCORP_LOAD_FROM_DISK_LRU,
    ROBOCORP_COMPUTE_ROBOT_LAUNCH_FROM_ROBOCORP_CODE_LAUNCH,
    ROBOCORP_RESOLVE_INTERPRETER,
    ROBOCORP_CLOUD_LOGOUT_INTERNAL,
    ROBOCORP_START_BROWSER_LOCATOR_INTERNAL,
    ROBOCORP_CREATE_LOCATOR_FROM_SCREEN_REGION_INTERNAL,
    ROBOCORP_CREATE_LOCATOR_FROM_BROWSER_PICK_INTERNAL,
    ROBOCORP_STOP_BROWSER_LOCATOR,
    ROBOCORP_GET_LOCATORS_JSON_INFO,
    ROBOCORP_SEND_METRIC,
    ROBOCORP_CONFIGURATION_DIAGNOSTICS_INTERNAL,
]

# SSH Interactive Node for Node-RED

The `NODE-RED-EXPECT-TCL` is a set of custom Node-RED nodes designed to establish an interactive SSH session to a remote server. It allows dynamic execution of commands within this session based on input messages, providing flexibility for automation tasks that require SSH connectivity.

## Features

- **Dynamic Connection Parameters**: Allows SSH connection details (host, port, username, password) to be specified dynamically via input messages, with the option to fall back on static configurations.
- **Interactive Session Management**: Maintains an interactive SSH session, enabling the execution of multiple commands in the context of a single, persistent session.
- **Connection Status Feedback**: Provides visual feedback within the Node-RED editor on the connection status, changing node color to indicate when the session is connected or disconnected.

## Installation

```
git clone
cd Node-RED-EXPECT-TCL
npm install
```

## Usage

1. **Configuration**: Drag the `SSH Connector` into your flow. Optionally, configure static default connection parameters (host, username, password, port) in the node's settings if you want to have fallback values.

2. **Dynamic Parameters**: Send an input message to the node with payload properties specifying `host`, `port`, `username`, and `password` for dynamic connection setup. Example message payload for dynamic parameters:

    ```json
    {
      "payload": {
        "host": "example.com",
        "port": 22,
        "username": "user",
        "password": "password"
      }
    }
    ```

3. **Executing Commands**: Once connected, send additional input messages with the `payload.command` property set to the command you wish to execute on the remote SSH server. The node maintains the session for subsequent commands.

4. **Connection Status**: Monitor the node's status in the Node-RED editor for connection feedback. A green node indicates an active connection, while red signifies disconnected.

5. **Session Closure**: To close the session, either deploy changes, stop the flow, or send a command to explicitly exit the session if needed.

## Security Considerations

- Handle sensitive information like passwords with care. Prefer dynamic input for sensitive details and secure the flow of these messages within your Node-RED environment.
- Consider using SSH keys for authentication where possible for enhanced security.

## Dependencies

- Requires the `ssh2` npm package for SSH connectivity.

## License



## Author

- Grey Dziuba / GitHub @gdziuba


import { spawn } from "child_process";
import stripAnsi from "strip-ansi";

interface ShellEnvVars {
    readonly [key: string]: string;
}

interface ShellEnvVarsInternal {
    [key: string]: string;
}

const defaultShell = (() => {
	const env = process.env;

	if (process.platform === 'darwin') {
		return env.SHELL || '/bin/bash';
	}

	if (process.platform === 'win32') {
		return env.COMSPEC || 'cmd.exe';
	}

	return env.SHELL || '/bin/sh';
})();

const args = [
	'-ilc',
	'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit'
];

const env = {
	// Disables Oh My Zsh auto-update thing that can block the process.
	DISABLE_AUTO_UPDATE: 'true'
};

const parseEnv = (env: string) => {
	env = env.split('_SHELL_ENV_DELIMITER_')[1];
	const ret: ShellEnvVarsInternal = {};

	for (const line of stripAnsi(env).split('\n').filter((line: string) => Boolean(line))) {
		const [key, ...values] = line.split('=');
		ret[key] = values.join('=');
	}

	return ret;
};

export async function shellEnv(shell?: string, timeout?: number): Promise<ShellEnvVars> {
	if (process.platform === 'win32') {
		return process.env;
	}

	timeout ??= 0;

	return new Promise(resolve => {
		console.log("spawning shell-env");
		const shellProcess = spawn(shell || defaultShell, args, { env });
		const aborter = setTimeout(() => {
			console.log("killing spawned shell-env, pid ", shellProcess.pid);
			shellProcess.kill("SIGTERM");
		}, timeout);
		let stdout: string = "";
		const stderr = [];
		shellProcess.stdout
		  .on("data", (data) => {
			console.log("shell stdout data", { data });
			if (stdout.length > 0) {
				if (!stdout.endsWith("\n")) {
					stdout = stdout + "\n";
				}
			}
			stdout = stdout + data;
		  })
		  .on("close", () => {
			console.log("shell stdout close");
		  })
		  .on("end", () => {
			console.log("shell stdout end");
		  })
		  .on("error", (error) => {
			console.log("shell stdout error", { error });
		  })
		  .on("readable", () => {
			console.log("shell stdout readable");
		  });
		shellProcess.stderr
		  .on("data", (data) => {
			console.log("shell stderr data", { data });
			stderr.push(data);
		  })
		  .on("close", () => {
			console.log("shell stderr close");
		  })
		  .on("end", () => {
			console.log("shell stderr end");
		  })
		  .on("error", (error) => {
			console.log("shell stderr error", { error });
		  })
		  .on("readable", () => {
			console.log("shell stderr readable");
		  });
		shellProcess
		  .on("exit", (code, signal) => {
			clearTimeout(aborter);
			console.log("shell exit", { code, signal });
			console.log("stdout:", stdout);
			resolve(parseEnv(stdout ?? ""));
		  })
		  .on("close", (code, signal) => {
			console.log("shell close", { code, signal });
		  })
		  .on("disconnect", () => {
			console.log("shell disconnect");
		  })
		  .on("error", (err) => {
			console.log("shell error", { err });
		  })
		  .on("message", (message) => {
			console.log("shell message", { message });
		  });
	  });
};

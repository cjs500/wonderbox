
/*

MIT License

Copyright (c) 2023 Cliff Sandford [cliffsandford1@gmail.com]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

//Set dirname
const __dirname = import.meta.dirname;

//Set Node JS constants
import * as path from "path";

//Set response data
var _response = {
    "status_code":200,
    "headers":{
        "Content-Type":"application/json"
    },
    "body":null
}

//Module request
export async function request(params={}) {
    //Set const
    const _env = params._server.environment;
    const _server = params._server;
    const _client = params._client;
    const _headers = params._headers;
    const _request = params._request;
    const _query = params._query;

    //Get query string
    if(_request.method == undefined) { _error("Method undefined"); return _response; }
    if(_request.method != "GET") {     _error("Method invalid"); return _response; }
	if(_query.action == undefined) {   _error("Missing API request"); return _response; }

    //Get properties
	let user_cookie = _client.cookie;
    let user_agent = _client.user_agent;
	let user_ip = _client.remote_ip;
	if(_client.remote_ip_xff) {
		user_ip = _client.remote_ip_xff;
	}
	
    //Adjust windows path issues
    let class_path = path.join(path.dirname(path.dirname(__dirname)),"class","manage_server.mjs");
    if(class_path.includes("\\")) {
        class_path = class_path.replaceAll("\\", "/");
        class_path = class_path.substring(2,(class_path.length));
    }

    //Initialize class
    const server = await import(class_path);
    const manage_server = server.manage_server;
	var mgmt = await new manage_server(user_cookie, user_agent, user_ip);

	//Response
	let api_response = null;
	let response = {
		"error":"",
		"state":"unauthenticated",
		"authenticated":false,
		"data":{}
	}

	//Do action
	switch(_query.action) {
		//Get configs
		case "get_configs":
			api_response = mgmt.get_configs();
			if(api_response.data != undefined) {
				response.data = api_response.data;
			}
		break;

		//Project manage
		case "project_new": 
		case "project_clone": 
		case "project_rename": 
		case "project_delete":
		case "project_set_property":
		case "project_fix_config":
			api_response = mgmt.project_manage(_query);
		break;

		//Template manage
		case "template_new":
		case "template_delete":
			api_response = mgmt.template_manage(_query);
			if(api_response.data != undefined) {
				response.data = api_response.data;
			}
		break;

		//Websites manage
		case "website_new":
		case "website_rename":
		case "website_clone":
		case "website_delete":
		case "website_set_property":
		case "website_map_add":
		case "website_map_delete":
		case "website_fix_default_pages":
			api_response = mgmt.website_manage(_query);
		break;

		//File Management
		case "files_get":
			api_response = mgmt.files_get(_query);
			if(api_response.data != undefined) {
				response.data = api_response.data;
			}
		break;
		case "files_view":
			api_response = mgmt.files_view(_query);
			if(api_response.data != undefined) {
				response.data = api_response.data;
			}
		break;
		case "files_add_folder":
			api_response = mgmt.files_add_folder(_query);
		break;
		case "files_add_file":
			api_response = mgmt.files_add_file(_query);
		break;
		case "files_delete":
			api_response = mgmt.files_delete(_query);
		break;

		//Mapping updates
		case "resolve_add": 
		case "resolve_update": 
		case "resolve_delete":
			api_response = mgmt.resolve_manage(_query);
		break;

		//Helpdocs
		case "helpdocs_index":
			api_response = mgmt.helpdocs_mange(_query);
			if(api_response.data != undefined) {
				response.data = api_response.data;
			}
		break;

		//Default mismatch action
		default:
			response.error = `Invalid request action [${_query.action}]`
	}

	//Handle API response
	if(api_response != null) {
		if(response.error != undefined) {
			if(api_response.error != "") {
				response.error = api_response.error;
			}
		}
		if(response.state != undefined) {
			response.state = api_response.state;
		}
		if(response.authenticated != undefined) {
			response.authenticated = api_response.authenticated;
		}
	}

	//Return response
	_return(response);

	//Return data
	return _response;
}

///////////////////////////////////////////
//Default function
///////////////////////////////////////////

function _error(out, status_code=200) {
    //Default content type
    if(status_code != 200) {
        _response["status_code"] = status_code;
    }
    _response["body"] = JSON.stringify({"error":out});
}
function _return(out) {
    //Default content type
    let content_type = "application/json";
    let content = {}
	
	//Set response type
	switch(typeof(out)) {
		case "object":
			content_type = "application/json";
			try {
				content = JSON.stringify(out);
			}catch{
				content_type = "text/html";
				content = out;
			}
		break;
        default:
			content_type = "text/html";
			content = out;
	}

    //Set response
    _response["headers"]["Content-Type"] = content_type;
    _response["body"] = content;
}

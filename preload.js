// Import the necessary Electron components.
const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;
// const path = require('path')

// White-listed channels.
const ipc = {
    'render': {
        // From render to main.
        'send': [
            'window:minimize',
            'window:maximize',
            'window:restore',
            'window:close'
        ],
        // From main to render.
        'receive': [],
        // From render to main and back again.
        'sendReceive': []
    }
};

// Exposed protected methods in the render process.
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods.
    'ipcRender', {
        // From render to main.
        send: (channel, args) => {
            let validChannels = ipc.render.send;
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, args);
            }
        },
        // From main to render.
        receive: (channel, listener) => {
            let validChannels = ipc.render.receive;
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender`.
                ipcRenderer.on(channel, (event, ...args) => listener(...args));
            }
        },
        // From render to main and back again.
        invoke: (channel, args) => {
            let validChannels = ipc.render.sendReceive;
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, args);
            }
        }
    }
);

// var fs = require('fs')

function setupBepinex(){
    alert("Currently this Mod Manager can't auto install BepInEx so you will have to set it up on your own. Sorry.")
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  

window.addEventListener('DOMContentLoaded', async () => {
  console.log("Window Loaded")
  
  if(window.localStorage.getItem("setup")!="true" && !window.location.href.includes("setup.html")){

    window.location.assign("setup.html")
    

  }else if(window.location.href.includes("setup.html")){
    document.getElementById("directory").value = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Bopl Battle"
    document.getElementById("button").onclick=()=>{
      ipcRenderer.invoke('dialog',"showOpenDialogSync",{
        properties: ['openFile', 'openDirectory']
      }).then((e)=>{
        // console.log(e)
        document.getElementById("directory").value = e[0]
      })
      
    }
    document.getElementById("use").onclick=async ()=>{
        var temp = await ipcRenderer.invoke('fs',"existsSync",...[document.getElementById("directory").value+"\\BepInEx\\plugins"])
        if(temp){
            localStorage.setItem("dir",document.getElementById("directory").value)
            localStorage.setItem("setup",true)
            window.location.assign("index.html")
        }else{
            setupBepinex()
        }
    }
    // dialog.showOpenDialogSync(window)
  }else{
    document.getElementById("launch").onclick=()=>{
        ipcRenderer.invoke('cmd','taskkill /F /IM BoplBattle.exe /T');
        var dir = localStorage.getItem("dir")
        ipcRenderer.invoke('cmd',`call "${dir+"\\BoplBattle.exe"}" /b`)
    }
    document.getElementById("updateDir").onclick=async ()=>{
        var dir = await ipcRenderer.invoke('dialog',"showOpenDialogSync",{
            properties: ['openFile', 'openDirectory']
        })
        if(await ipcRenderer.invoke('fs',"existsSync",...[dir[0]+"\\BepInEx\\plugins"])==true){
            localStorage.setItem("dir",dir[0])
            refresh()  
        }else{
            setupBepinex()
        }
        
        
    }
    document.getElementById("addMod").onclick = async ()=>{
        var filePath = await ipcRenderer.invoke("dialog","showOpenDialog",{ properties: ['openFile'], filters:[{ name: 'Mod DLL', extensions: ['dll']}] })
        filePath = filePath.filePaths[0]
        console.log(filePath)
        if(filePath == undefined){
            alert("No file was selected!")
            return;
        }
        var fileName = /.+[/\\](.+)/.exec(filePath)[1]
        console.log(fileName)

        var dir = localStorage.getItem("dir")
        var newPath = dir+"\\BepInEx\\plugins\\"+fileName

        if(await ipcRenderer.invoke("fs","existsSync",...[newPath+".disabled"])==true){
            newPath+=".disabled"
        }

        await ipcRenderer.invoke("copyFile",filePath,newPath)

        refresh()
    }
    
    async function refresh(){

        var list = document.getElementById("list")
        list.innerHTML = ""
        
    
        var plugins = await ipcRenderer.invoke('fs',"readdirSync", ...[localStorage.getItem("dir")+"\\BepInEx\\plugins"])
        // var pluginList1 = await ipcRenderer.invoke('fetchText',"https://raw.githubusercontent.com/WackyModer/BoplModManager_modlist/main/mods.txt")
        // pluginList1 = pluginList1.split("\n")
        // var pluginList = {}
        // for(let i = 0;i<pluginList1.length/5;i+=1){
        //     let plugin = {}
        //     plugin.name = await /^.+[|](.+)[|]$/.exec(pluginList1[i*1-1])
        //     plugin.description = await /^.+[|](.+)[|]$/.exec(pluginList1[i*2-1])
        //     plugin.dl_link = await /^.+[|](.+)[|]$/.exec(pluginList1[i*3-1])
        //     plugin.author = await /^.+[|](.+)[|]$/.exec(pluginList1[i*4-1])
        //     console.log(plugin)
        //     console.log(i)
        //     pluginList[plugin.name] == plugin
        // }

        // console.log(pluginList)

        // console.log(plugins)
        var dir = localStorage.getItem("dir")
        for(const e of plugins){
            var div = document.createElement("div")
            div.classList+="item"
            var checkbox = document.createElement("input")
            checkbox.classList+="itemCheckbox"
            checkbox.type="checkbox"
            checkbox.checked = !e.endsWith(".disabled")
            div.appendChild(checkbox)
            var span = document.createElement("span")
            span.classList+='itemSpan'
            span.innerHTML=e.replace(".dll","").replace(".disabled","")
            div.appendChild(span)
            list.appendChild(div)
            let temp = e
            let checkbox2 = checkbox
            checkbox.addEventListener("change",async ()=>{
                if(await ipcRenderer.invoke("fs","existsSync",...[dir+"\\BepInEx\\plugins\\"+temp])==false)refresh()
                console.log(temp)
                var oldPathh = dir+"\\BepInEx\\plugins\\"+temp
                temp = temp.replaceAll(".disabled","")
                if(checkbox2.checked==false){
                    temp= temp+".disabled"
                }
                var newPathh = dir+"\\BepInEx\\plugins\\"+temp
                console.log(div)
                console.log(temp)
                document.getElementById("launch").disabled=true
                await ipcRenderer.invoke("rename",oldPathh,newPathh)
                document.getElementById("launch").disabled=false
            })
            div.onmouseover = ()=>{
                
            }
        };
        
    }
    document.getElementById("refresh").addEventListener("click",async ()=>{
        await refresh()
    })
    refresh()
    await sleep(1000)
    refresh()
    


  }

})

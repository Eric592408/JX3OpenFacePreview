<script setup lang="ts">
import { NButton, NFloatButton, NDivider, NFlex, useMessage } from 'naive-ui'
import { type CollectData, collectEvents } from '@/interface/face'
import { saveAs } from 'file-saver'
import localforage from 'localforage'
import { ref, watch } from 'vue';
import jszip from 'jszip'
import { getAssetPath } from '@/lib/assets'

import { panelEvents } from '@/interface/panels'


panelEvents.on('open', (id: string) => {
    if (id !== "collect") {
        closeMask()
    }
})

const collectdb = localforage.createInstance({
    name: 'collect_face',
})
const isShow = ref<boolean>(false);
const message = useMessage()
const collectList = ref<CollectData[]>([]);
const downloading = ref(false);
const showHideTime = 300
const showCollect = () => {
    if (downloading.value) return
    if (isShow.value) {
        isShow.value = false
        
        setTimeout(() => {
            panelShow.value = true
        }, showHideTime);
    } else {
        panelShow.value = true
        setTimeout(() => {
            isShow.value = true
        }, 0);
        panelEvents.emit('open', 'collect')
        getCollectList()
    }

}

const getCollectList = async () => {
    collectList.value = [];
    // 获取所有收藏的id
    const ids = await collectdb.keys()
    for (let id of ids) {
        const data = await collectdb.getItem<CollectData>(id)
        if (data) collectList.value.push(data)
    }
}

const removeCollect = async (id: string) => {
    await collectdb.removeItem(id)
    collectList.value = collectList.value.filter(v => v.id != id)
    collectEvents.emit('remove', id)
}

const removeAllCollect = async (successData: string[]) => {
    const ids = await collectdb.keys()
    for (let id of ids) {
        if (successData.indexOf(id) != -1) {
            await removeCollect(id)
        }
    }
}

const closeMask = () => {
    if (downloading.value) return
    isShow.value = false
    setTimeout(() => {
        panelShow.value = isShow.value
    }, showHideTime);
}

const downloadText = ref("")

const downloadButton = async () => {
    if (collectList.value.length === 0) {
        message.warning("空空如也，没有东西可以下载哦~")
        return
    }
    const zipFile = new jszip()
    let index = 1
    downloading.value = true
    let count = 0
    downloadText.value = `正在下载中`
    const successData: string[] = []
    for (let data of collectList.value) {
        let ext = ".ini"
        if (data.style != "real") ext = ".dat"

        try {
            const fileData = await fetch(getAssetPath('face' + ext, `${data.style}/${data.sex}/${data.id}`))
            let filename = data.name + ext
            while ((filename in zipFile.files)) {
                filename = data.name + '(' + index + ')' + ext
                index++
            }
            zipFile.file(filename, await fileData.blob())
            successData.push(data.id)
        } catch (error) {
            console.error(error)
            message.error(`下载 ${data.name} 失败！`)
            continue
        }

        count += 1
        downloadText.value = `${count} / ${collectList.value.length}`
    }
    zipFile.generateAsync({ type: "blob" }).then(function (content) {
        // 生成二进制流
        saveAs(content, "faces.zip")
        removeAllCollect(successData)
        isShow.value = false
    })
    downloading.value = false


}

const panelShow = ref(false)
const panelClass = () => {
    if (isShow.value)
        return ' panel-show'
    else
        return ' panel-hide'
}

watch(downloading, (newVal) => {
    panelEvents.emit("downloading", newVal)
})

</script>

<template>
    <n-float-button class="fixed hover-button" :right="20" :bottom="60" :width="60" :height="60" text
        @click="showCollect()">
        <img src="@/assets/collect.svg" style="height: 40px; margin-top: 8px;" />
    </n-float-button>
    <div class="mask" v-show="isShow" @click="closeMask">
    </div>
    <div :class="'fixed-menu collect' + panelClass()" v-show="panelShow">
        <div style="height:470px; overflow: auto;">
            <n-flex class="collect-i" v-for="data in collectList" :key="data.id">
                <n-flex justify="space-between" style="width: 100%;">
                    <div style="max-width: 230px; ">{{ data.name }}</div>
                    <n-button text class="hover-button" :disabled="downloading" @click="removeCollect(data.id)">
                        <img src="@/assets/remove.svg" style="height: 20px;" />
                    </n-button>
                </n-flex>
                <n-divider style="margin-top: 0px; margin-bottom: 0px;" />
            </n-flex>
        </div>

        <n-button :loading="downloading" type="info" secondary round @click="downloadButton"
            style="margin-bottom: 5px; width: 286px; margin-top: 10px;">{{ downloading ? downloadText
        : "打包下载全部" }}</n-button>
    </div>
</template>

<style>
.fixed {
    z-index: 20;
}

.fixed-menu {
    z-index: 20;
    right: 100px;
    bottom: 20px;
    position: fixed;
}

.mask {
    height: 100vh;
    width: 100vw;
    top: 0;
    position: fixed;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 10;
}

.collect {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    padding-right: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    height: 500px;
    width: 300px;
    /* overflow-y: auto; */
}

.collect-i {
    /* display: flex;
    align-items: center;
    justify-content: space-between; */
    padding: 5px 10px 5px 5px;
}

.panel-show {
    visibility: visible;
    opacity: 1;
    transition: all 0.3s;
    transform: translateY(0px);
}

.panel-hide {
    visibility: hidden;
    opacity: 0;
    transition: all 0.3s;
    transform: translateY(100px);
}

.hover-button {
    display: inline-block;
    font-size: 16px;
    text-align: center;
    text-decoration: none;
    border: none;
    cursor: pointer;
    outline: none;
    color: white;
    transition: all 0.3s;
}

.hover-button:hover {
    transform: scale(1.2);
}

.hover-button:active {
    transform: scale(2);
}
</style>
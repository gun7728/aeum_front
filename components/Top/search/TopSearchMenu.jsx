'use client'
import styles from "@/styles/header.module.scss";
import {AiOutlineLeft, AiOutlineSearch} from "react-icons/ai";
import {useEffect, useRef, useState} from "react";
import {HiArrowLeft, HiOutlineSwitchVertical, HiX} from "react-icons/hi";
import useSWR from "swr";
import useSearchAction from "@/hooks/useSearchAction";
import useList from "@/hooks/useList";
import useStores from "@/hooks/useStores";
import {decode} from "@googlemaps/polyline-codec"
import process from "next/dist/build/webpack/loaders/resolve-url-loader/lib/postcss";
import useMap from "@/hooks/useMap";
import useMenu from "@/hooks/useMenu";
import useLoading from "@/hooks/useLoading";
import {TbRoute} from "react-icons/tb"
import {calculateDistance, getBoundingBoxCoordinates, isCoordinateInsideBoundingBox} from "@/components/commom"


export default function TopSearchMenu(){

    //하단 바텀 메뉴 상태 관리
    const {setBottomMenuStatus} = useMenu()
    const {data:bottomMenuStatus} = useSWR('/bottom/status')

    const {data:assistFilteredStore} = useSWR('/stores/assist/filtered')

    const {setListOpen,setListReOpen} = useList();
    const {setSearchWord, setSearchOpen, setAssistOption} = useSearchAction();
    const {setChoseStore, setAssistStore,setAssistAddStore} = useStores();
    const {setStartStore, setEndStore, setRoute, resetSelectStore, setRouteDetail, setRouteTotalTime} = useMap();
    const {setLoading} = useLoading()


    const {data:map} = useSWR('/map')
    const {data:assistAddStore} = useSWR('/stores/assist/add')

    const { data:stores } = useSWR('/stores');
    const {data:searchStart} = useSWR('/search');
    const {data:searchWord} = useSWR('/search/word');
    const {data:startStore} = useSWR('/map/start')
    const {data:endStore} = useSWR('/map/end')
    const {data:route} = useSWR('/map/route')

    const { data:sMarker } = useSWR('/map/screen/marker')
    const { data:sMarkerName } = useSWR('/map/screen/marker/name')

    const [str,setStr] = useState()
    const inputRef = useRef();
    const spRef = useRef();
    const epRef = useRef();
    const spRouteRef = useRef();
    const epRouteRef = useRef();
    const [startMarker, setStartMarker] = useState();
    const [endMarker, setEndMarker] = useState();
    const [assistMarker, setAssistMarker] = useState([])
    const [assistMarkerNames, setAssistMarkerNames] = useState([])
    const [startFlag, setStartFlag] = useState(true);
    const [totalTime, setTotalTime] = useState();
    const [detailInfo, setDetailInfo] = useState([]);
    const [defaultRouteList, setDefaultRouteList] = useState();
    const [walkingRouteList, setWalkingRouteList] = useState();

    const [assistAddMarker,setAssistAddMarker] = useState([])
    const [assistAddMarkerNames,setAssistAddMarkerNames] = useState([])

    const [originSM, setOriginSM] = useState();
    const [originSMN, setOriginSMN] = useState();
    const [originEM, setOriginEM] = useState();
    const [originEMN, setOriginEMN] = useState();

    const searchWordFunc = (()=>{
        if(str!=''){
            setSearchWord(str);
            setBottomMenuStatus('searchResult')
        }
    })

    useEffect(()=>{
        if(searchWord !=='' && searchStart){
            inputRef.current.value=searchWord
        }
    },[searchWord,searchStart])


    useEffect(()=>{
        if(startStore){
            setBottomMenuStatus('search')

            if(bottomMenuStatus!=='assist'){
                spRef.current.value = startStore.title
                epRef.current.focus();
            }
        }
        if(endStore){
            setBottomMenuStatus('search')

            if(bottomMenuStatus!=='assist'){
                epRef.current.value = endStore.title
                spRef.current.focus();
            }
        }
        if(startStore && endStore){
            setRouteNearStore(map, startStore.mapy, startStore.mapx, endStore.mapy, endStore.mapx)
        }
    },[startStore,endStore])



    const startStr =async  (str) =>{
        setStr(str)
        if(str==''){
            if(startMarker){
                startMarker.setMap(null)
                setStartMarker(null)
                setBottomMenuStatus('searchResult')
            }
            if(route){
                if(route.length>0){
                    route.map((e)=>{
                        e.setMap(null);
                    })
                }
                setStartFlag(true)
            }

            setStartStore(null)
            setListOpen(false)
        }
    }
    const endStr = async (str) =>{
        setStr(str)
        if(str==''){
            if(endMarker){
                endMarker.setMap(null)
                setEndMarker(null)
                setBottomMenuStatus('searchResult')
            }
            if(route){
                if(route.length>0){
                    route.map((e)=>{
                        e.setMap(null);
                    })
                }
                setStartFlag(true)
            }

            setEndStore(null)
            setListOpen(false)
        }
    }
    const resetStartEnd = async () => {



        if(originSM){
            originSM.setMap(map)
        }
        if(originEM){
            originEM.setMap(map)
        }
        if(originSMN){
            originSMN.setMap(map)
        }
        if(originEMN){
            originEMN.setMap(map)
        }
        resetSelectStore();
        if(assistMarker.length>0){
            assistMarker.map((am)=>{
                am.setMap(null);
            })
        }
        if(assistMarkerNames.length>0){
            assistMarkerNames.map((amn)=>{
                amn.setMap(null);
            })
        }
        if(assistAddMarker.length>0){
            assistAddMarker.map((am)=>{
                am.setMap(null);
            })
        }
        if(assistAddMarkerNames.length>0){
            assistAddMarkerNames.map((amn)=>{
                amn.setMap(null);
            })
        }

        await startMarker?.setMap(null)
        await endMarker?.setMap(null)

        sMarker.map((sm)=>{sm.setMap(map)})
        sMarkerName.map((sm)=>{sm.setMap(map)})

        if(route){
            if(route.length>0){
                route.map((e)=>{
                    e.setMap(null);
                })
            }
        }

        setBottomMenuStatus('default')
        setAssistOption([12,14,15,25,28,32,38,39])
        setAssistAddStore([]);

        inputRef.current.value = null
    }

    const switchStartEnd = async () =>{
        await startMarker?.setMap(null)
        await endMarker?.setMap(null)

        var sp  = startStore;
        var ep  = endStore;

        setStartStore(ep)
        setEndStore(sp)
    }

    useEffect(()=>{
        if(!startStore) return;
        sMarker.map((mk)=>{
            if(parseFloat(startStore.mapx).toFixed(10) ==parseFloat(mk.getPosition().La).toFixed(10)){
                if(parseFloat(startStore.mapy).toFixed(10) == parseFloat(mk.getPosition().Ma).toFixed(10)){
                    setOriginSM(mk)
                    mk.setMap(null)
                }
            }
        })
        sMarkerName.map((mn)=>{
            if(parseFloat(startStore.mapx).toFixed(10) ==parseFloat(mn.getPosition().La).toFixed(10)){
                if(parseFloat(startStore.mapy).toFixed(10) == parseFloat(mn.getPosition().Ma).toFixed(10)){
                    setOriginSMN(mn)
                    mn.setMap(null)
                }
            }
        })
        var icon = new kakao.maps.MarkerImage(
            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png',
            new kakao.maps.Size(51, 60))

        var marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(startStore.mapy,startStore.mapx),
            zIndex: 4,
            image: icon
        });

        setStartMarker(marker)
        marker.setMap(map);
    },[startStore])

    useEffect(()=>{
        if(!endStore) return;
        sMarker.map((mk)=>{
            if(parseFloat(endStore.mapx).toFixed(10) ==parseFloat(mk.getPosition().La).toFixed(10)){
                if(parseFloat(endStore.mapy).toFixed(10) == parseFloat(mk.getPosition().Ma).toFixed(10)){
                    setOriginEM(mk)
                    mk.setMap(null)
                }
            }
        })
        sMarkerName.map((mn)=>{
            if(parseFloat(endStore.mapx).toFixed(10) ==parseFloat(mn.getPosition().La).toFixed(10)){
                if(parseFloat(endStore.mapy).toFixed(10) == parseFloat(mn.getPosition().Ma).toFixed(10)){
                    setOriginEMN(mn)
                    mn.setMap(null)
                }
            }
        })
        var icon = new kakao.maps.MarkerImage(
            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png',
            new kakao.maps.Size(51, 60))

        var marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(endStore.mapy,endStore.mapx),
            zIndex: 4,
            image: icon
        });

        setEndMarker(marker)
        marker.setMap(map);
    },[endStore])

    const setSearchPage = ((bool)=>{
        if(searchStart&&!bool){

        }else{
            setSearchOpen(bool)
        }
        if(!bool) {
            inputRef.current.value=null
            setSearchWord(null)
        }
    })
    const setSearchStatus = () => {

        setChoseStore(null)
        setListOpen(false)
        setListReOpen(false)
    }


    function decodePolyline(encoded) {
        if (!encoded) {
            return [];
        }
        var poly = [];
        var index = 0, len = encoded.length;
        var lat = 0, lng = 0;

        while (index < len) {
            var b, shift = 0, result = 0;

            do {
                b = encoded.charCodeAt(index++) - 63;
                result = result | ((b & 0x1f) << shift);
                shift += 5;
            } while (b >= 0x20);

            var dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;

            do {
                b = encoded.charCodeAt(index++) - 63;
                result = result | ((b & 0x1f) << shift);
                shift += 5;
            } while (b >= 0x20);

            var dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            var p = {
                y: lat / 1e5,
                x: lng / 1e5,
            };
            poly.push(p);
        }
        return poly;
    }

    async function tMapRoad(sx, sy, ex, ey) {
        await fetch(`https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result&startX=${sx}&startY=${sy}&endX=${ex}&endY=${ey}&reqCoordType=WGS84GEO&startName=출발지&endName=도착지&appKey=${process.env.TMAP_KEY}`)
            .then(function (response) {
                return response.json()
            }).then(function (data) {
                return data;
        })
        //
        // return new Promise((resolve, reject)=>{
        //     var xhr = new XMLHttpRequest();
        //     var url =
        //     xhr.open("GET", url, true);
        //     xhr.send()
        //     xhr.onreadystatechange = function () {
        //         if (xhr.readyState == 4 && xhr.status == 200) {
        //             var resultJsonData = JSON.parse(xhr.responseText);
        //
        //             resolve(resultJsonData);
        //         }
        //     }
        // })
    }


    async function routeWithAssist(){
        if(assistAddStore){

            setLoading(true);
            assistMarker?.forEach((mk)=>{mk.setMap(null)})
            assistMarkerNames?.forEach((mn)=>{mn.setMap(null)})

            var markerList = [];
            var markerNameList = [];

            assistAddStore.forEach((dt)=>{
                var icon = typeIcons(dt.contenttypeid)
                var marker = new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(dt.mapy,dt.mapx),
                    image: icon
                });
                var content = '<span class="info-title">'+dt.title+'</span>'
                // 인포윈도우로 장소에 대한 설명을 표시합니다
                var infoWindow = new kakao.maps.InfoWindow({
                    content: content,
                });
                infoWindow.open(map, marker);
                var infoTitle = document.querySelectorAll('.info-title');
                infoTitle.forEach(function(e) {
                    var w = e.offsetWidth + 10;
                    var ml = w/2;
                    e.parentElement.style.top = "82px";
                    e.parentElement.style.left = "50%";
                    e.parentElement.style.marginLeft = -ml+"px";
                    e.parentElement.style.width = "auto";
                    e.parentElement.previousSibling.style.display = "none";
                    e.parentElement.parentElement.style.border = "0px";
                    e.parentElement.parentElement.style.background = "unset";
                    e.parentElement.parentElement.style.pointerEvents = "none";
                });
                markerList.push(marker);
                markerNameList.push(infoWindow);
            })

            markerList.forEach((mk)=>{
                mk.setMap(map)
            })
            markerNameList.forEach((mn)=>{
                mn.setMap(map)
            })

            setAssistAddMarker(markerList)
            setAssistAddMarkerNames(markerNameList)

            var routeList = [];
            var routeTempList = [];
            var tempTotalTime = 0;
            var tempDetail = [];
            var tempList = [...assistAddStore];
            if(tempList.length>0) {
                tempList.map((store) => {
                    store.dis = calculateDistance(parseFloat(startStore.mapy), parseFloat(startStore.mapx), parseFloat(store.mapy), parseFloat(store.mapx))
                })
                tempList.sort((a, b) => a.dis - b.dis)

            }
            const func = async () => {
                for (let i = 0, max = assistAddStore.length; i <= max; i++) {
                    var url = ''
                    if(assistAddStore.length==0){
                        url = `/googleApi/json?origin=${startStore.mapy}%2C${startStore.mapx}&destination=${endStore.mapy}%2C${endStore.mapx}&mode=transit&key=${process.env.GOOGLE_KEY}`;
                    }else{
                        if (i == 0) {
                            url = `/googleApi/json?origin=${startStore.mapy}%2C${startStore.mapx}&destination=${assistAddStore[i].mapy}%2C${assistAddStore[i].mapx}&mode=transit&key=${process.env.GOOGLE_KEY}`;
                        } else if (i == max) {
                            url = `/googleApi/json?origin=${assistAddStore[i - 1].mapy}%2C${assistAddStore[i - 1].mapx}&destination=${endStore.mapy}%2C${endStore.mapx}&mode=transit&key=${process.env.GOOGLE_KEY}`;
                        } else {
                            url = `/googleApi/json?origin=${assistAddStore[i - 1].mapy}%2C${assistAddStore[i - 1].mapx}&destination=${assistAddStore[i].mapy}%2C${assistAddStore[i].mapx}&mode=transit&key=${process.env.GOOGLE_KEY}`;
                        }
                    }

                    await fetch(url)
                        .then(function (response) {
                            return response.json()
                        }).then(function (data) {
                            data.routes[0].legs[0].steps.map((step) => {
                                tempDetail.push({
                                    "type":step.travel_mode,
                                    "name":step.travel_mode!=='WALKING'?step.transit_details?.departure_stop?.name:step.html_instructions,
                                    "arrival":step.travel_mode!=='WALKING'?step.transit_details.arrival_stop?.name:'',
                                    "shortName":step.transit_details?.line?.short_name,
                                    "color":step.transit_details?.line?.color,
                                    "vehicle":step.transit_details?.line?.vehicle.name,
                                    "time":step.duration.value,
                                })
                                routeTempList.push(step)
                                tempTotalTime += step.duration.value;
                            })
                        })
                }
            }
            await func()
            routeList = await stepCal(routeTempList)

            tempDetail.map((detail)=>{
                detail.percent = Math.floor(parseFloat((parseFloat(detail.time)/tempTotalTime)*100))
            })
            setDetailInfo(tempDetail)
            setRouteDetail(tempDetail);
            setDefaultRouteList(routeList)
            setTotalTime(tempTotalTime);
            setRouteTotalTime(tempTotalTime);
            drawLine(routeList)
            setLoading(false);
            setBottomMenuStatus('assistRoute')
            // var route = resultJsonData[0].legs[0];
        }
    }

    async function stepCal(route){
        var tempList = [];

        async function getRoute() {
            await Promise.all(route.map(async (step) => {
                var color = '#111111'
                var lineAr = [];

                if (step.travel_mode === 'TRANSIT') {
                    color = step.transit_details.line.color
                    var lines = decodePolyline(step.polyline.points)
                    lines.map((line) => {
                        lineAr.push(new kakao.maps.LatLng(line.y, line.x))
                    })
                } else if (step.travel_mode === 'WALKING') {
                    if (checkInsideKorea({lat: step.start_location.lat, lng: step.start_location.lng})) {
                        // var roadData =  await tMapRoad(step.start_location.lng, step.start_location.lat, step.end_location.lng, step.end_location.lat)

                        var roadData;
                        await fetch(`https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result&startX=${step.start_location.lng}&startY=${step.start_location.lat}&endX=${step.end_location.lng}&endY=${step.end_location.lat}&reqCoordType=WGS84GEO&startName=출발지&endName=도착지&appKey=${process.env.TMAP_KEY}`)
                            .then(function (response) {
                                return response.json()
                            }).then(function (data) {
                                roadData = data;
                            })

                        roadData.features.map((feat) => {
                            if (typeof feat.geometry.coordinates[0] === "number") {
                                lineAr.push(new kakao.maps.LatLng(feat.geometry.coordinates[1], feat.geometry.coordinates[0]))
                            } else {
                                feat.geometry.coordinates.map((coor) => {
                                    lineAr.push(new kakao.maps.LatLng(coor[1], coor[0]))
                                })
                            }
                        })
                    } else {
                        step.steps.map((st) => {

                            var lines = decodePolyline((st.polyline.points).toString())
                            lines.map((line) => {
                                lineAr.push(new kakao.maps.LatLng(line.y, line.x))
                            })
                        })
                        var lines = decodePolyline(step.polyline.points)
                        lines.map((line) => {
                            lineAr.push(new kakao.maps.LatLng(line.y, line.x))
                        })
                    }
                }
                var kakaoRoute = {
                    map: map,
                    path: lineAr,
                    strokeWeight: 5,
                    strokeColor: color
                }
                tempList.push(kakaoRoute)
            }))
        }
        await getRoute();
        return tempList
    }
    function setRouteNearStore(map, sy, sx, ey, ex){
        setLoading(true);
        setBottomMenuStatus('assist')
        var points = [
            new kakao.maps.LatLng(sy, sx),
            new kakao.maps.LatLng(ey, ex)
        ];

        var bounds = new kakao.maps.LatLngBounds();

        var boundingBox = getBoundingBoxCoordinates(ey,ex,sy,sx)

        var datas = [];

        var count = {
            "12":0,
            "14":0,
            "15":0,
            "25":0,
            "28":0,
            "32":0,
            "38":0,
            "39":0,
        }

        stores.map((e)=>{
            var coordinateToCheck = { lat: (e.mapy), lon: (e.mapx) };

            if (isCoordinateInsideBoundingBox(coordinateToCheck, boundingBox)) {
                if (count[`${e.contenttypeid}`] < 10) {
                    if (startStore.contentid !== e.contentid && endStore.contentid !== e.contentid) {
                        datas.push(e)
                        count[`${e.contenttypeid}`]++;
                    }
                }
            }
        })




        var markerList = [];
        var markerNameList = [];
        datas.forEach((dt)=>{
            var icon = typeIcons(dt.contenttypeid)
            var marker = new kakao.maps.Marker({
                position: new kakao.maps.LatLng(dt.mapy,dt.mapx),
                image: icon
            });
            var content = '<span class="info-title">'+dt.title+'</span>'
            // 인포윈도우로 장소에 대한 설명을 표시합니다
            var infoWindow = new kakao.maps.InfoWindow({
                content: content,
            });
            infoWindow.open(map, marker);
            var infoTitle = document.querySelectorAll('.info-title');
            infoTitle.forEach(function(e) {
                var w = e.offsetWidth + 10;
                var ml = w/2;
                e.parentElement.style.top = "82px";
                e.parentElement.style.left = "50%";
                e.parentElement.style.marginLeft = -ml+"px";
                e.parentElement.style.width = "auto";
                e.parentElement.previousSibling.style.display = "none";
                e.parentElement.parentElement.style.border = "0px";
                e.parentElement.parentElement.style.background = "unset";
                e.parentElement.parentElement.style.pointerEvents = "none";
            });
            markerList.push(marker);
            markerNameList.push(infoWindow);
        })
        setAssistMarker(markerList)
        setAssistMarkerNames(markerNameList)
        markerList.forEach((mk)=>{
            mk.setMap(map)
        })
        markerNameList.forEach((mn)=>{
            mn.setMap(map)
        })

        setAssistStore(datas);

        for (var i = 0; i < points.length; i++) {
            bounds.extend(points[i]);
        }

        setLoading(false);
        map.setBounds(bounds);
    }
    useEffect(()=>{
        if(bottomMenuStatus==='assist') {
            spRouteRef.current.value=startStore.title
            epRouteRef.current.value=endStore.title
        }
    },[bottomMenuStatus])

    useEffect(()=>{
        var tempMk = [];
        var tempMn = [];
        if(bottomMenuStatus==='assist'){
            assistFilteredStore.map((store)=>{
                var tempMarkerList = [...assistMarker]
                tempMarkerList.forEach((mk)=>{
                    if(parseFloat(store.mapx).toFixed(10) ===parseFloat(mk.getPosition().La).toFixed(10)) {
                        tempMk.push(mk)
                    }
                })

                var tempNameList = [...assistMarkerNames]
                tempNameList.forEach((mn)=>{
                    if(parseFloat(store.mapx).toFixed(10) ===parseFloat(mn.getPosition().La).toFixed(10)) {
                        tempMn.push(mn)
                    }
                })
            })

            assistMarker.forEach((mk)=>{mk.setMap(null)})
            assistMarkerNames.forEach((mn)=>{mn.setMap(null)})

            tempMk.forEach((t)=>{t.setMap(map)})
            tempMn.forEach((t)=>{t.setMap(map)})
        }

    },[assistFilteredStore,assistMarker,assistMarkerNames])


    function typeIcons(id){
        var loc = '';
        // 12:관광지(tours), 14:문화시설, 15:축제공연행사, 25:여행코스, 28:레포츠, 32:숙박, 38:쇼핑, 39:음식점
        switch(String(id)){
            case '12':
                loc = '/icons/tours.png'
                break;
            case '14':
                loc = '/icons/astrology.png'
                break;
            case '15':
                loc = '/icons/concerts.png'
                break;
            case '25':
                loc = '/icons/automotive.png'
                break;
            case '28':
                loc = '/icons/sporting-goods.png'
                break;
            case '32':
                loc = '/icons/hotels.png'
                break;
            case '38':
                loc = '/icons/shopping.png'
                break;
            case '39':
                loc = '/icons/food.png'
                break;
        }
        var icon=  new kakao.maps.MarkerImage(
                loc,
            new kakao.maps.Size(31, 35));
        return icon
    }

    function drawLine(routes){
        var getRouteList = [];
        routes?.forEach((e)=> {
            var getRoute = new kakao.maps.Polyline(e);
            getRouteList.push(getRoute)
        });
        setRoute(getRouteList)
    }

    function checkInsideKorea({ lat, lng }) {
        const coordinateList = [
            {lat:39.105648,lng:129.293848},
            {lat:37.472782,lng:131.597259},
            {lat:34.743466,lng:129.259321},
            {lat:33.810255,lng:128.903499},
            {lat:32.599185,lng:125.157071},
            {lat:34.458362,lng:124.150105},
            {lat:37.65974,lng:124.97210}
        ];
        const size = coordinateList.length;

        if (size < 3) {
            return false;
        }

        let isInner = false;
        let followIndex = size - 1;

        for (let cur = 0; cur < size; cur++) {
            const curPos = coordinateList[cur];
            const prevPos = coordinateList[followIndex];

            if (
                (curPos.lng < lng && prevPos.lng >= lng) ||
                (prevPos.lng < lng && curPos.lng >= lng)
            ) {
                /**
                 * 직선의 방정식: y - y1 = M * (x - x1)
                 * 기울기: M = (y2 - y1) / (x2 - x1)
                 */
                if (curPos.lat + ((lng - curPos.lng) / (prevPos.lng - curPos.lng)) * (prevPos.lat - curPos.lat) < lat) {
                    isInner = !isInner;
                }
            }

            followIndex = cur;
        }
        return isInner;
    };

    function tMapResult(map, sx, sy, ex, ey){
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                appKey: 'SmS45nXtKg6A50z1o8fk4240ewoFBidx9xvUvE3j'
            },
            body: JSON.stringify({
                startX: sx,
                startY: sy,
                endX: ex,
                endY: ey,
                lang: 0,
                format: 'json',
                count: 10,
            })
        };

        fetch('https://apis.openapi.sk.com/transit/routes', options)
            .then(response => response.json())
            .then(response => console.log(response))
            .catch(err => console.error(err));
    }
    const deleteRoute = (spot) =>{
        let tempList = []
        tempList = [...assistAddStore];
        tempList = tempList.filter(function(data) {
            return data.contentid !== spot.contentid;
        });
        setAssistAddStore([...tempList])
    }
    return(
        <>
            {
                (String(bottomMenuStatus)?.includes('assist'))?
                    <div   className={`${styles.startEndBox} 
                            ${(bottomMenuStatus==='assist' ? styles.assistBox : '' )}
                            ${(bottomMenuStatus==='assistRoute' ? styles.assistRouteBox : '' )}`}
                    >
                        {
                            bottomMenuStatus==='assist'?
                                <>
                        <HiX
                            onClick={()=>resetStartEnd()}
                            className={styles.exitBtn}/>
                        <TbRoute
                            onClick={()=>routeWithAssist()}
                            className={styles.assistRouteBtn}/>
                        <input
                            onClick={setSearchStatus}
                            onKeyDown={(e)=>{
                                if(e.target.value=='') setBottomMenuStatus('search')
                                if(e.code==='Enter'  || e.code==="NumpadEnter" ||e.keyCode===13 ){
                                    searchWordFunc()
                                }
                            }

                            }
                            disabled={bottomMenuStatus==='assist'?true:false}
                            onChange={(e)=>{startStr(e.target.value)}}
                            placeholder={'출발지를 선택해 주세요.'}
                            ref={spRouteRef}
                            className={styles.startItem}/>
                        <div className={styles.assistRouteListDiv}>
                            <ul className={styles.assistRouteList}>
                                {
                                    assistAddStore?
                                    assistAddStore.map((store,idx)=>{
                                        return (<li key={idx} className={styles.assistRouteStore} onClick={()=>{deleteRoute(store)}}><span>{store.title}</span></li>)
                                    })
                                    :<></>
                                }
                            </ul>
                        </div>
                        <input
                            onClick={setSearchStatus}
                            onKeyDown={(e)=>{
                                if(e.target.value=='') setBottomMenuStatus('search')
                                if(e.code==='Enter'  || e.code==="NumpadEnter" ||e.keyCode===13 ){
                                    searchWordFunc()
                                }
                            }

                            }
                            disabled={bottomMenuStatus==='assist'?true:false}
                            onChange={(e)=>{endStr(e.target.value)}}
                            placeholder={'도착지를 선택해 주세요.'}
                            ref={epRouteRef}
                            className={styles.endItem}/>
                            </>
                            :
                            <>
                                <HiX
                                    onClick={()=>resetStartEnd()}
                                    className={styles.routeExitBtn}
                                />
                            </>
                        }
                    </div>
            :
            <div style={( endStore || startStore ) ? {} :  {display:'none'}} className={`${styles.startEndBox} }`} >
                <HiOutlineSwitchVertical
                    onClick={()=>switchStartEnd()}
                    className={styles.switchBtn}/>
                <HiX
                    onClick={()=>resetStartEnd()}
                    className={styles.exitBtn}/>
                <input
                    onClick={setSearchStatus}
                    onKeyDown={(e)=>{
                        if(e.target.value=='') setBottomMenuStatus('search')
                        if(e.code==='Enter'  || e.code==="NumpadEnter" ||e.keyCode===13 ){
                            searchWordFunc()
                        }
                    }

                    }
                    onChange={(e)=>{startStr(e.target.value)}}
                    placeholder={'출발지를 선택해 주세요.'}
                    ref={spRef}
                    className={styles.startItem}/>

                <input
                    onClick={setSearchStatus}
                    onKeyDown={(e)=>{
                        if(e.target.value=='') setBottomMenuStatus('search')
                        if(e.code==='Enter'  || e.code==="NumpadEnter" ||e.keyCode===13 ){
                            searchWordFunc()
                        }
                    }

                    }
                    onChange={(e)=>{endStr(e.target.value)}}
                    placeholder={'도착지를 선택해 주세요.'}
                    ref={epRef}
                    className={styles.endItem}/>
            </div>
        }
                    <div style={( endStore || startStore ) ? {display:'none'}:{}} className={styles.searchBox}>
                <AiOutlineSearch className={styles.searchBtn}  onClick={()=>{searchWordFunc()}}/>
                <AiOutlineLeft style={(String(bottomMenuStatus).includes('search'))?'':{display:'none'}} className={styles.flexBtn}
                   onClick={()=>{
                       inputRef.current.value=''
                       setBottomMenuStatus('default')
                       setChoseStore(null)
                }}/>
                    <input
                        ref={inputRef}
                        className={styles.flexItem}
                            className={!(String(bottomMenuStatus).includes('search'))?`${styles.flexItem}`: `${styles.flexItemActive}`}
                           onKeyDown={(e)=>{
                               if(e.target.value=='') setBottomMenuStatus('search')

                               if(e.code==='Enter'  || e.code==="NumpadEnter" ||e.keyCode===13 ){
                                   searchWordFunc()
                               }
                           }

                           }
                           onChange={(e)=>{setStr(e.target.value)}}
                           onClick={()=>{
                               setBottomMenuStatus('search')
                               setListOpen(false),
                               setChoseStore(null)
                           }}
                           type={"text"}
                           placeholder={'장소, 주소 검색'}
                    ></input>
                </div>
        </>
    )
}

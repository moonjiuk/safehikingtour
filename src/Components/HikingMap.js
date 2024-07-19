import React, { useState, useEffect, useRef } from 'react';
import MarkerInfo from '../Image/MarkerInfo.png';
import MarkerBlack from '../Image/MarkerBlack.png';
import MarkerBlue from '../Image/MarkerBlue.png';
import MarkerOrange from '../Image/MarkerOrange.png';
import MarkerRed from '../Image/MarkerRed.png';
import HikingRiskAreas from '../Data/hikingRiskAreas.json';
import MountainPeaks from '../Data/mountainPeaks.json';

/* global kakao */

const HikingMap = () => {
    const [map, setMap] = useState(null); // 지도 객체를 저장하는 상태 변수
    const mapContainer = useRef(null); // 지도 컨테이너를 참조하는 useRef 객체
    const mountainAreas = HikingRiskAreas // 산악 위험 지역 정보를 저장하는 상태 변수
    const mountainPeaks = MountainPeaks // 산악 봉우리 정보를 저장하는 상태 변수
    const [inputText, setInputText] = useState(''); // 입력 상태를 관리하는 상태 변수
    const [places, setPlaces] = useState([]); // 장소 검색 결과를 저장하는 상태 변수
    const [selectedLocation, setSelectedLocation] = useState(null); // 선택된 위치 정보를 저장하는 상태 변수
    const [tourismSpots, setTourismSpots] = useState([]); // 주변 관광지 정보를 저장하는 상태 변수
    




    // Kakao Maps API 스크립트 로드 후, 지도 초기화
    useEffect(() => {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=7addc1cfbf3f649d565d0467de87b27c&autoload=false&libraries=services,clusterer`;
        document.head.appendChild(script);

        script.onload = () => {
            kakao.maps.load(() => {
                const container = mapContainer.current;
                const options = {
                    center: new kakao.maps.LatLng(33.4506810661721, 126.57049341667), // 초기 지도 중심 좌표 설정
                    level: 4 // 초기 지도 확대/축소 레벨 설정
                };
                const newMap = new kakao.maps.Map(container, options); // 새로운 지도 객체 생성
                setMap(newMap); // 생성된 지도 객체를 상태 변수에 저장
            });
        };
    }, []);

    // 이펙트 함수는 지도 및 산악 정보(mountainAreas 및 mountainPeaks)가 변경될 때 호출됩니다.
    useEffect(() => {
        // 지도와 산악 지역 및 봉우리 데이터가 준비되어 있을 때만 실행합니다.
        if (map) {
            // 각 산봉우리에 대한 마커를 생성하고 설정합니다.
            mountainPeaks.forEach(peak => {
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(peak.lat, peak.lot),
                    title: peak.placeNm
                });
                // 봉우리 마커 이미지를 설정합니다.
                marker.setImage(new kakao.maps.MarkerImage(
                    MarkerBlack, 
                    new kakao.maps.Size(24, 35)
                ));
            });

            // 각 산악 지역에 대한 마커를 생성하고 설정합니다.
            mountainAreas.forEach(area => {
                let imageSrc;
                // 산악 지역 유형에 따라 마커 이미지를 선택합니다.
                switch (area.plcTypeCd) {
                    case 'DANGER':
                        imageSrc = MarkerRed;
                        break;
                    case 'SHELTER':
                        imageSrc = MarkerOrange;
                        break;
                    default:
                        imageSrc = MarkerRed;
                }
                const marker = new kakao.maps.Marker({
                    map: map,
                    position: new kakao.maps.LatLng(area.lat, area.lot),
                    title: area.plcNm
                });
                // 산악 지역 마커 이미지를 설정합니다.
                marker.setImage(new kakao.maps.MarkerImage(
                    imageSrc, 
                    new kakao.maps.Size(24, 35)
                ));
            });
        }
    }, [map]);

     // 입력 텍스트 변경 시 호출되는 핸들러 함수
     const handleInputChange = (e) => {
        const { value } = e.target;
        setInputText(value);
        if (!value.trim()) {
            setPlaces([]); // 입력이 공백인 경우 장소 목록 초기화
            return;
        }
        searchPlaces(value); // 장소 검색 함수 호출
    };

    // Kakao Maps Places API를 사용하여 장소를 검색하는 함수
    const searchPlaces = (keyword) => {
        const ps = new kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                setPlaces(data); // 검색 결과를 상태 변수에 설정
            } else {
                setPlaces([]); // 검색 결과가 없는 경우 빈 배열 설정
            }
        });
    };

    // 장소 선택 시 호출되는 핸들러 함수
    const handlePlaceSelect = (place) => {
        //console.log(`Selected place: ${place.place_name}`);
        //console.log(`Address: ${place.address_name}`);
        //console.log(`Coordinates: Latitude ${place.y}, Longitude ${place.x}`);

        // 선택된 위치 좌표 설정
        setSelectedLocation({
            latitude: place.y,
            longitude: place.x
        });

        // 선택된 주소로 지도 이동
        if (map) {
            const moveLatLon = new kakao.maps.LatLng(place.y, place.x);
            map.panTo(moveLatLon);

            // 선택된 주소에 마커 추가
            const marker = new kakao.maps.Marker({
                map: map,
                position: moveLatLon,
                title: place.place_name
            });
            marker.setImage(new kakao.maps.MarkerImage(
                MarkerBlue, 
                new kakao.maps.Size(24, 35)
            ));
        }
    };

    // 선택된 위치 변경 시 호출되는 효과
    useEffect(() => {
        const fetchNearbyTourismSpots = async () => {
            if (selectedLocation) {
                const url = 'https://apis.data.go.kr/B551011/KorService1/locationBasedList1';
                const params = new URLSearchParams({
                    serviceKey: 'U62bzn4ae8kub7VNW4NViYCyj8hZUzULvAtCJyigub1NG69v+ex6yXtooFqjF9n4BS+xLX5HX/uy29vTA5Iv/A==',
                    numOfRows: '20',
                    pageNo: '1',
                    MobileOS: 'ETC',
                    MobileApp: 'SafeHikingTour',
                    arrange: 'A',
                    mapX: selectedLocation.longitude.toString(),
                    mapY: selectedLocation.latitude.toString(),
                    radius: '5000',
                    listYN: 'Y',
                    _type: 'json'
                });

                try {
                    const response = await fetch(`${url}?${params.toString()}`);
                    const data = await response.json();
                    setTourismSpots(data.response.body.items.item); // 주변 관광지 정보 설정
                } catch (error) {
                    console.error('Error fetching nearby tourism spots:', error);
                }
            }
        };

        fetchNearbyTourismSpots();
    }, [selectedLocation]);




    
    return (
        <div className='hikingMap'>
            <div className='mapContainer' ref={mapContainer}/>
            
            <div className='info'>
                <img className='markerInfoImg' src={MarkerInfo} alt="마커 설명" />
                <div className='search'>
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder="장소 검색"
                    />
                    {places.length > 0 && (
                        <ul>
                            {places.map((place, index) => (
                                <li key={index} onClick={() => handlePlaceSelect(place)}>
                                    <button><strong>{place.place_name}</strong><br />{place.address_name}</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className='tourList'>
                    <h3>주변 관광지</h3>
                    <ul>
                        {tourismSpots.map((spot, index) => (
                            <li key={index}>
                                <strong>{spot.title}</strong><br />
                                {spot.addr1}<br />
                                ({(parseFloat(spot.dist)/1000).toFixed(1)}km)
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HikingMap;

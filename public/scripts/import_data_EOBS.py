# -*- coding: utf8 -*-
import pymongo
import os
import pandas
import datetime
import LatLon
import re
import datetime
from bson.objectid import ObjectId

def converter_lat(lat):
    # Latitude in degrees:minutes:seconds (+: North, -: South)
    lat = re.sub('\+','N ',lat)
    lat = re.sub('\-','S ',lat)
    return round(LatLon.string2latlon(lat,'E 00:00:00','H% %d%:%m%:%S').lat.decimal_degree,3)

def converter_lon(lon):
    # Longitude in degrees:minutes:seconds (+: East, -: West)
    lon = re.sub('\+','E ',lon)
    lon = re.sub('\-','W ',lon)
    return round(LatLon.string2latlon('N 00:00:00',lon,'H% %d%:%m%:%S').lon.decimal_degree,3)

def converter_Q_RR(Q_RR):
    # Quality code for RR (0='valid'; 1='suspect'; 9='missing')
    if Q_RR == 0:
        out = 'valid'
    elif Q_RR == 1:
        out = 'suspect'
    elif Q_RR == 9:
        out = 'missing'
    else:
        out = None
    return out

def format_station(s):
    return {
        'sta_id':s['STAID'],
        'name':s['STANAME'],
        'country_code':s['CN'],
        'location':{
            'type':"Point",
            'coordinates':[
                s['LON'],
                s['LAT']
            ]
        }
    }

def format_precipitations(s,_id_Station):
    return {
        'date':datetime.datetime.strptime(str(s['DATE']),'%Y%m%d'),
        '_id_Station':_id_Station,
        'precipitation':round(s['RR']/10,1),
        'quality':s['Q_RR']
    }

def format_temperatures(s,_id_Station):
    return {
        'date':datetime.datetime.strptime(str(s['DATE']),'%Y%m%d'),
        '_id_Station':_id_Station,
        'temperature':round(s['TG']/10,2),
        'quality':s['Q_TG']
    }

def read_station(file_path):
    stations = pandas.read_csv(
        file_path,
        sep='\s*,\s*',
        skiprows=17,
        skip_blank_lines=True,
        na_values=-9999,
        converters={
            'LAT':converter_lat,
            'LON':converter_lon
        }).to_dict(orient='records')
    return [format_station(s) for s in stations]

def read_precipitation(file_path,_id_Station):
    data = pandas.read_csv(
        file_path,
        sep='\s*,\s*',
        skiprows=19,
        skip_blank_lines=True,
        na_values=-9999,
        converters={
            'Q_RR':converter_Q_RR
        }).to_dict(orient='records')
    return [format_precipitations(d,_id_Station) for d in data]

def read_temperature(file_path,_id_Station):
    data = pandas.read_csv(
        file_path,
        sep='\s*,\s*',
        skiprows=19,
        skip_blank_lines=True,
        na_values=-9999,
        converters={
            'Q_TG':converter_Q_RR
        }).to_dict(orient='records')
    return [format_temperatures(d,_id_Station) for d in data]

def main():
    # meteor mongo -U
    Client = pymongo.MongoClient(host='127.0.0.1', port=3002);
    db = Client.meteor;
    db.drop_collection('Stations')
    db.drop_collection('Precipitations')
    db.drop_collection('Temperatures')
    db.Stations.create_index("sta_id",unique=True)
    stations_precipitation = read_station(os.path.join('..','data','EOBS','Precipitations','stations.txt'))
    stations_temperature = read_station(os.path.join('..','data','EOBS','Temperatures','stations.txt'))
    stations = []
    stations.extend(stations_precipitation)
    stations.extend(stations_temperature)

    try:
        db.Stations.insert(stations,continue_on_error=True)
    except:
        1+1

    for station in stations_precipitation:
        file_path = os.path.join('..','data','EOBS','Precipitations','RR_STAID'+str(station['sta_id']).zfill(6)+'.txt')
        station_db = db.Stations.find_one({'sta_id':station['sta_id']})
        if station_db is not None and os.path.exists(file_path):
            precipitations = read_precipitation(file_path,station_db['_id'])
            db.Precipitations.insert(precipitations)

    for station in stations_temperature:
        file_path = os.path.join('..','data','EOBS','Temperatures','TG_STAID'+str(station['sta_id']).zfill(6)+'.txt')
        station_db = db.Stations.find_one({'sta_id':station['sta_id']})
        if station_db is not None and os.path.exists(file_path):
            temperaures = read_temperature(file_path,station_db['_id'])
            db.Temperatures.insert(temperaures)

if __name__ == '__main__':
    main()

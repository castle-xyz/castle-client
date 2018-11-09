FROM debian:latest

# These were from trying to compile on amazon linux
#RUN yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
#RUN yum -y groupinstall "Development Tools"


RUN apt-get update
RUN apt-get install -y build-essential autotools-dev automake libtool pkg-config libdevil-dev libfreetype6-dev libluajit-5.1-dev libphysfs-dev libsdl2-dev libopenal-dev libogg-dev libvorbis-dev libflac-dev libflac++-dev libmodplug-dev libmpg123-dev libmng-dev libtheora-dev
RUN apt-get install -y libturbojpeg; exit 0
RUN ln -s /usr/lib/x86_64-linux-gnu/libturbojpeg.so.0 /usr/lib/x86_64-linux-gnu/libturbojpeg.so
RUN apt-get install -y cmake

WORKDIR /app

# Installs OpenSSL to /usr/local/ssl
COPY openssl-1.0.2l.tar.gz openssl-1.0.2l.tar.gz
RUN tar -xf openssl-1.0.2l.tar.gz && cd openssl-1.0.2l && ./config && make install && cd .. && rm openssl-1.0.2l.tar.gz && rm -rf openssl-1.0.2l



#COPY base base/
#COPY common common/
#COPY ghost-extensions ghost-extensions/
#COPY linux linux/
#COPY love love/
#COPY openssl openssl/

FROM amazonlinux:latest

# These were from trying to compile on amazon linux
RUN yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
#RUN yum -y groupinstall "Development Tools"

#luajit mesa-libGL-devel 

WORKDIR /app

RUN yum -y install freetype-devel glibc-devel physfs-devel mesa-libGL-devel libvorbis-devel SDL-devel libmng-devel libtiff-devel lua-devel gcc-c++ libtool libtheora-devel
RUN yum -y groupinstall "Development Tools"

# Installs OpenSSL to /usr/local/ssl
COPY openssl-1.0.2l.tar.gz openssl-1.0.2l.tar.gz
RUN tar -xf openssl-1.0.2l.tar.gz && cd openssl-1.0.2l && ./config && make install && cd .. && rm openssl-1.0.2l.tar.gz && rm -rf openssl-1.0.2l

#RUN echo "source /hbb_exe/activate" >> ~/.bashrc

# Need wget and hg for building packages
# hg install steps from http://e-mak.blogspot.com/2016/04/how-to-install-mercurial-in-centos-7.html
#RUN cd /etc/yum.repos.d && printf "[mercurial]\nname=Mercurial packages for CentOS7\n# baseurl\nbaseurl=https://www.mercurial-scm.org/release/centos\$releasever\nskip_if_unavailable=True \nenabled=1\ngpgcheck=0" > mercurial.repo && yum -y install wget mercurial git

RUN yum -y install wget mercurial git
RUN cd /opt && wget https://cmake.org/files/v3.12/cmake-3.12.4.tar.gz && tar -zxvf cmake-3.12.4.tar.gz && cd cmake-3.12.4 && ./configure && gmake && gmake install

# luajit luajit-devel
RUN cd /opt && wget https://luajit.org/download/LuaJIT-2.0.5.tar.gz && tar -zxvf LuaJIT-2.0.5.tar.gz && cd LuaJIT-2.0.5 && make && make install

# SDL2-devel
# --disable-video-vulkan is needed to prevent `xcb/xcb.h: No such file or directory `
RUN cd /opt && hg clone https://hg.libsdl.org/SDL -r 8feb5da6f2fb SDL && cd SDL && mkdir build && cd build && ../configure --disable-video-vulkan && make && make install

# DevIL-devel
#RUN cd /opt && wget https://downloads.sourceforge.net/openil/DevIL-1.8.0.tar.gz && tar -zxvf DevIL-1.8.0.tar.gz && cd DevIL/DevIL && sed -i 's/ILU\ SHARED/ILU/g' src-ILU/CMakeLists.txt && sed -i 's/ILUT\ SHARED/ILUT/g' src-ILUT/CMakeLists.txt && mkdir build && cd build && cmake -DBUILD_SHARED_LIBS=OFF .. && make && make install
RUN cd /opt && wget https://downloads.sourceforge.net/openil/DevIL-1.8.0.tar.gz && tar -zxvf DevIL-1.8.0.tar.gz && cd DevIL/DevIL && mkdir build && cd build && cmake .. && make && make install

# openal-soft-devel
#RUN cd /opt && source /hbb_exe/activate && wget https://github.com/kcat/openal-soft/archive/v1.18.zip && 
RUN yum -y install openal-soft-devel libmodplug-devel libmpg123-devel

# libmodplug-devel
# libmpg123-devel

#COPY base base/
#COPY common common/
#COPY ghost-extensions ghost-extensions/
#COPY linux linux/
#COPY love love/
#COPY openssl openssl/

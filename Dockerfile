FROM nginx:1.25.3
WORKDIR /usr/src/app
COPY package*.json ./
RUN rm -r /usr/share/nginx/html/*
COPY /dist/tarifas-front/browser /usr/share/nginx/html/tarifas/
COPY nginx-custom.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

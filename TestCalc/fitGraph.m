clear all;
close all;
X = [10; 15; 20; 25; 30; 35; 40; 45; 50];
    
Y = [6.076278918444858;
    1.9250837336102817;
    2.206446850393701;
    1.044688862465319;
    1.3747593094220163;
    0.661782154722354;
    1.6464805561590268;
    0.46317152740208856;
    1.858914282814271 ];

%fo = fitoptions('Method','NonlinearLeastSquares',...
%               'Lower',[-Inf,-Inf,-Inf],...
%               'Upper',[2,10,Inf],...
%               'StartPoint',[2 -min(X)+1 1]);
%ft = fittype('-a*log(x-b)+c','options',fo);


fo = fitoptions('Method','NonlinearLeastSquares',...
               'Lower',[-Inf,-Inf,-Inf],...
               'Upper',[Inf,Inf,Inf],...
               'StartPoint',[2 -min(X)+1 1]);
ft = fittype('(a/(x+b))+ c','options',fo);

plot(X,Y)
hold;
f = fit(X,Y, ft);

plot (f, X, Y);